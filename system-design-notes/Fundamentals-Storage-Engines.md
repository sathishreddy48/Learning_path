# Storage Engines: B-Trees, LSM Trees and the Write Path

## Introduction
"Which database would you use?" is a question about storage engines as much as about products. Almost every store in these notes is built on one of two structures, and the choice determines whether the system is good at writes or good at reads, how much disk it wastes, and how its latency behaves under load.

**The one-sentence version:** B-trees update data in place and give predictable reads; LSM trees only ever append and give much faster writes, paying for it with background compaction and variable read latency — and nearly every "SQL vs NoSQL" conversation is really this difference wearing a costume.

This is the machinery underneath [Chapter 6](../06.%20Key-Value%20Store/), and it is where "why Cassandra rather than Postgres?" should actually be answered.

## Durability first: the write-ahead log

### Explanation
Both families share one mechanism, and it is the foundation of durability everywhere. Before any change is applied to the main data structure, it is appended to a **write-ahead log** and flushed to disk. Only then is the write acknowledged.

The reasoning: updating a tree or a table means several non-atomic page writes, and a crash halfway through leaves the structure corrupt. The log is a single sequential append — hard to corrupt, and cheap, because sequential writes are dramatically faster than random ones on both spinning disks and SSDs. On restart, replay the log from the last checkpoint and the structure is rebuilt.

> **Where the durability guarantee actually lives:** a write is durable when `fsync` returns, not when `write` does — the data sits in the OS page cache until then. Systems that acknowledge before `fsync` are trading durability for latency, usually deliberately and usually configurably (`innodb_flush_log_at_trx_commit`, Postgres `synchronous_commit`, Kafka `acks` plus flush settings). Group commit recovers much of the cost by batching many transactions into one `fsync`. Being able to say "acknowledged means fsynced, and here is the knob that changes that" is a strong signal in any durability discussion.

## B-trees

### Explanation
A B-tree keeps keys sorted in fixed-size pages, typically 4–16 KB, with a shallow, wide structure — a tree of depth 3 or 4 can index billions of keys. A lookup walks from the root to a leaf, reading one page per level.

Writes **update in place**: find the leaf, modify the page, write it back. If the page is full it splits, which may cascade upward.

**Strengths.** Reads are predictable — a bounded number of page reads, with upper levels almost always cached. Range scans and ordered iteration are natural because the leaves are in key order. Point reads have low, stable latency.

**Weaknesses.** Every write is a random write to a page somewhere on disk, plus the log write — so the same logical change is written at least twice (**write amplification**). Page splits fragment the file over time. Concurrency needs careful latching of pages.

This is what PostgreSQL, MySQL/InnoDB, SQL Server and most traditional stores use, and it is why they are excellent at mixed read-write workloads with range queries and comparatively poor at sustained very high write rates.

## LSM trees

### Explanation
A log-structured merge tree never updates anything in place. The write path is:

1. Append to the write-ahead log (durability).
2. Insert into an in-memory sorted structure, the **memtable** — usually a skip list or balanced tree.
3. When the memtable is full, flush it to disk as an immutable sorted file, an **SSTable**, in one sequential write.
4. In the background, **compact**: merge SSTables together, discarding superseded values and tombstones.

Every disk write is sequential, which is why LSM trees absorb writes so much faster than B-trees.

Reads pay for it. A key might be in the memtable, or in any SSTable, so a read checks the memtable, then files newest-first, until found. Two mechanisms keep that affordable:

- **Bloom filters.** A small probabilistic structure per SSTable answering "is this key definitely absent?" False positives are possible, false negatives are not — so a bloom filter can skip a file entirely but never wrongly skip one. This is what stops a read from touching every file.
- **Sparse indexes.** One index entry per block rather than per key, so the index stays in memory and a read seeks to a block and scans it.

**Deletes are writes.** Removing a key appends a **tombstone** marking it deleted; the space is not reclaimed until compaction. A workload with heavy deletes can therefore *grow* on disk, and a range scan over a heavily-deleted range may read many tombstones to return nothing — the classic Cassandra operational trap.

This is what Cassandra, RocksDB, LevelDB, HBase and ScyllaDB use.

### The two compaction strategies
Compaction is where the trade-off is tuned, and the two strategies pull in opposite directions:

- **Size-tiered.** Merge SSTables of similar size together. Cheap on writes, but several files can hold the same key, so reads touch more files and the same data may exist in several copies at once — high **space amplification**, with transient spikes during a merge.
- **Levelled.** Keep each level's files non-overlapping in key range, so a key appears at most once per level. Reads touch far fewer files and space overhead is small, but a write is rewritten repeatedly as it migrates down the levels — high **write amplification**.

> **The three amplifications:** **write amplification** is bytes written to disk per byte of data; **read amplification** is disk reads per logical read; **space amplification** is bytes stored per byte of live data. You cannot minimise all three — it is a genuine trilemma, and the compaction strategy is where you pick your corner. Size-tiered trades space for write cost; levelled trades write cost for space and reads; B-trees sit at moderate write amplification with low read and space amplification. Naming these three is far more precise than "LSM is better for writes" and it is what the question is really probing.

## Choosing between them

| | B-tree | LSM tree |
|---|---|---|
| Write path | Random, in place | Sequential, append only |
| Write throughput | Moderate | **High** |
| Point read latency | **Low, predictable** | Higher, variable |
| Range scans | **Natural, fast** | Good, but merges across files |
| Space amplification | Low (some fragmentation) | Higher, and spikes during compaction |
| Write amplification | Moderate (log + page) | Strategy-dependent, can be high |
| Latency outliers | Few | **Compaction causes them** |
| Deletes | Immediate | Tombstones, reclaimed later |
| Typical home | Postgres, MySQL, SQL Server | Cassandra, RocksDB, HBase |

> **Interview angle:** translate the question into the workload rather than naming a product. "Write-heavy, mostly point lookups by a known key, and I can tolerate occasional latency spikes" is an LSM argument. "Mixed read-write, range queries over secondary attributes, and I need predictable tail latency" is a B-tree argument. The detail that distinguishes a strong answer is **tail latency**: LSM compaction competes for disk and CPU with foreground requests, so p99 is noticeably worse and spikier than p50 even when average throughput is excellent. If the requirement is a tight p99 — a trading system, an ad server with a hard budget — that is a real argument against LSM, and almost nobody raises it.

## The patterns these engines explain

### Explanation
Several things that look like separate design decisions elsewhere are consequences of the engine underneath:

- **Why Cassandra wants you to design the table around the query.** Reads are cheap only along the partition and clustering key order the SSTables are sorted by. Querying another way means scanning, so you denormalise and write the data again in a second table.
- **Why append-only logs are everywhere.** Kafka is an LSM write path with the compaction made optional and the log exposed as the product. The same insight — sequential writes are fast, and an immutable log is easy to replicate — drives event sourcing and the materialised-view patterns in [Patterns §2](Patterns.md).
- **Why "just add an index" is not free.** Every secondary index is another structure to maintain on every write, with its own write amplification. On an LSM store it is worse, because the index must be kept consistent with data that is only reconciled at compaction time — which is why some stores offer only eventually-consistent secondary indexes, or none at all.
- **Why time-series stores are their own category.** The workload is append-mostly with timestamp-ordered keys and bulk expiry, which suits an LSM engine with time-windowed compaction so whole SSTables can be dropped when they age out, with no tombstones at all.

> **Interview angle:** the move that lands is reaching past the product name to the mechanism. "I would use Cassandra" is a weaker answer than "the write rate is the binding constraint and the access pattern is a point lookup on a known partition key, so I want an LSM engine — Cassandra or Scylla — and I will accept that secondary access paths mean writing the data twice." The second version survives the follow-up, because it has already stated the cost. It also makes the design portable: if the interviewer says "assume you cannot use Cassandra", you have said what you actually need and can name a substitute.

## Where to go next
- [Chapter 6: Key-Value Store](../06.%20Key-Value%20Store/) — an LSM store built up from first principles.
- [Replication and consensus](Fundamentals-Replication.md) — how these engines are kept in sync across machines.
- [Patterns](Patterns.md) — the immutable-log-plus-derived-view pattern this engine makes cheap.
