# Recurring Patterns

The 28 chapters in these notes describe 28 systems. They do not describe 28 ideas — the same dozen keep reappearing in different costumes, and a question that looks unfamiliar is usually a familiar pattern with new nouns.

This page names those patterns. It is the page worth reading when you have finished the chapters, and the one worth skimming before an interview: **recognising which pattern a question is will tell you which chapters to borrow from.**

Each entry gives the pattern, the question to ask when you suspect it, and where it appears.

---

## 1. Fan-out: pay on write, or pay on read

One event must reach many places. You can precompute every recipient's view when the event happens (**push** / fan-out on write), or assemble it when each recipient asks (**pull** / fan-out on read).

| | Push (fan-out on write) | Pull (fan-out on read) |
|---|---|---|
| Work per **event** | O(recipients) | O(1) |
| Work per **read** | O(1) | O(sources) |
| Cost driven by | Users with many *followers* | Users who follow many *sources* |
| Wasted work | Writing for people who never look | Recomputing the same view repeatedly |
| Breaks when | One source has millions of recipients | Everyone has many sources and reads often |

**The question to ask:** *how skewed is the fan-out distribution?* If it is uniform, pick whichever side is cheaper. If it has a long tail — one account with ten million followers — no single choice works and you need a hybrid, or a cap.

**Where it appears**

| Chapter | The fan-out | Resolution |
|---|---|---|
| [11 – News Feed](./11.%20News%20Feed%20System/#write-amplification-versus-read-amplification) | Post → followers' feeds | **Hybrid** — push for ordinary users, pull for celebrities |
| [12 – Chat](./12.%20Chat%20System/#group-chat) | Message → group members' inboxes | **Push**, made safe by the 100-member cap |
| [10 – Notifications](./10.%20Notification%20System/) | Notification → a user's devices | Push; the cap is devices per user |
| [17 – Nearby Friends](./17.%20Nearby%20Friends/) | Location update → friends | Push, with a 5,000-friend cap; most of it discarded by a distance filter |
| [23 – Email](./23.%20Distributed%20Email%20Service/) | One email → recipients' mailboxes | **Push, with no alternative** — federation means you cannot ask another provider to compute a view |

Notice the pattern within the pattern: **a cap on fan-out is what makes push viable.** Chapter 12's 100-member groups and chapter 17's 5,000 friends are not simplifications for the reader's benefit; they are the assumptions that keep the design from needing chapter 11's hybrid.

---

## 2. An immutable log plus a derived view

Store what *happened* as an append-only sequence, and treat current state as a projection of it that can be thrown away and rebuilt.

**Why it keeps winning:** appending is the fastest thing a disk does, history becomes auditable because nothing is ever overwritten, and the expensive-to-maintain thing (the view) stops being precious.

**The question to ask:** *which of these two things cannot be regenerated?* That one must be durable and replicated. Everything else is an optimisation.

| Chapter | The log | The derived view |
|---|---|---|
| [19 – Message Queue](./19.%20Distributed%20Message%20Queue/) | The partition log itself | Consumer offsets |
| [6 – Key-Value Store](./06.%20Key-Value%20Store/#write-and-read-paths) | Commit log, then SSTables | Memtable, Bloom filters, compacted files |
| [21 – Ad Clicks](./21.%20Ad%20Click%20Event%20Aggregation/) | Raw click events | Per-minute aggregates |
| [25 – Leaderboard](./25.%20Real-time%20Gaming%20Leaderboard/) | Durable score log | Redis sorted set |
| [26 – Payments](./26.%20Payment%20System/#double-entry-ledger-system) | Double-entry ledger | Wallet balance |
| [27 – Digital Wallet](./27.%20%20Digital%20Wallet/#event-sourcing) | Event list | Account balances, snapshots |
| [28 – Stock Exchange](./28.%20Stock%20Exchange/) | Sequenced event stream | Order book |
| [24 – Object Storage](./24.%20S3-like%20Object%20Storage/) | Immutable packed files | Object mapping index |

Three consequences that come with the pattern every time:

- **Replay cost grows forever**, so you need periodic **snapshots** — and a snapshot must never become a source of truth.
- **Replay must be deterministic**, or the view you rebuild is not the view you had. Every non-deterministic input (a clock, a random value, an external call) has to be resolved *before* the entry is written and recorded inside it. [Chapter 27](./27.%20%20Digital%20Wallet/#gotchas--failure-modes) and [Chapter 28](./28.%20Stock%20Exchange/#determinism) both rest on this.
- **Deletion stops being deletion.** With nothing mutable, an absence is recorded by appending a marker — a tombstone in [Chapter 6](./06.%20Key-Value%20Store/#gotchas--failure-modes), a delete marker in [Chapter 24](./24.%20S3-like%20Object%20Storage/#object-versioning), a reversing entry in [Chapter 26](./26.%20Payment%20System/) — and space comes back later, via compaction or garbage collection.

---

## 3. At-least-once delivery plus idempotent processing

"Exactly-once delivery" is not available across a network. What is available, and what every system here actually does, is **deliver at least once and make the processing idempotent**, which produces exactly-once *effects*.

**The question to ask:** *what enforces the uniqueness — the storage engine, or application code?* A check-then-act in application code races; a unique constraint cannot.

| Chapter | The idempotency key | Enforced by |
|---|---|---|
| [26 – Payments](./26.%20Payment%20System/#exactly-once-delivery) | Client-supplied `idempotency-key` | Unique index, plus the stored response |
| [22 – Hotel Reservation](./22.%20Hotel%20Reservation%20System/#concurrency-issues) | `reservation_id`, created before submission | Unique constraint |
| [12 – Chat](./12.%20Chat%20System/#gotchas--failure-modes) | `client_msg_id` | Server-side dedup |
| [21 – Ad Clicks](./21.%20Ad%20Click%20Event%20Aggregation/#data-deduplication) | `(ad_id, minute)` | Upsert instead of increment — replay changes nothing |
| [19 – Message Queue](./19.%20Distributed%20Message%20Queue/#exactly-once) | Producer ID plus sequence number | Broker-side dedup |
| [10 – Notifications](./10.%20Notification%20System/#reliability) | Event ID, within a TTL window | Atomic conditional write |
| [23 – Email](./23.%20Distributed%20Email%20Service/) | `Message-Id` | Receiver-side dedup |

Four details that separate a working implementation from a broken one, drawn from [Chapter 26](./26.%20Payment%20System/#exactly-once-delivery):

1. **The key must be generated by the client, before the first attempt** — a server-generated key differs per retry and deduplicates nothing.
2. **Store the response, not just the key**, or a retry cannot return the same answer.
3. **A reused key with a different payload must error**, not silently return the old result, or a genuinely different request vanishes.
4. **Keys expire**, and a retry after the window creates a duplicate. Pick a window longer than any realistic retry path.

And the honest framing for an interview: say "at-least-once plus idempotent processing", not "exactly-once". The second invites a question you cannot answer; the first *is* the answer.

---

## 4. A hot key is not a partitioning problem

Consistent hashing, sharding and partitioning all distribute **keys**. None of them distribute **requests to a single key**. One viral post, one dense map cell, one popular merchant, one in-demand hotel-date — each concentrates on whichever node owns that key, and adding nodes does nothing.

**The question to ask:** *does an invariant live in this key?* That decides which remedies are available.

| Remedy | Works when | Cost |
|---|---|---|
| **Replicate** the hot entry | It is read-heavy and immutable-ish | More copies to keep consistent |
| **Cache it locally** on every server | Reads dominate | Staleness, memory on every node |
| **Salt / bucket** the key, aggregate in two stages | The operation is associative (counting, summing) | Reads become scatter-gather |
| **Deliberately serialise** it with a queue | Writes must be ordered anyway | A hard throughput ceiling, accepted knowingly |

| Chapter | The hot key | Why it cannot be split |
|---|---|---|
| [5 – Consistent Hashing](./05.%20Consistent%20Hashing/#gotchas--failure-modes) | — | States the general result: it balances keys, not traffic |
| [11 – News Feed](./11.%20News%20Feed%20System/#gotchas--failure-modes) | A viral post in the content cache | — (replicate or cache locally) |
| [16 – Proximity](./16.%20Proximity%20Service/#gotchas--failure-modes) | A dense geohash cell | — |
| [21 – Ad Clicks](./21.%20Ad%20Click%20Event%20Aggregation/#scale-the-system) | A viral ad | Counting is associative, so **salting works** |
| [22 – Hotel](./22.%20Hotel%20Reservation%20System/#scalability) | One `(hotel, room type, date)` row | **The capacity invariant is in that row** |
| [25 – Leaderboard](./25.%20Real-time%20Gaming%20Leaderboard/#scaling-redis) | The whole leaderboard is one Redis key | Rank requires a single ordering |
| [27 – Digital Wallet](./27.%20%20Digital%20Wallet/) | A popular merchant's account | **The balance invariant is in that account** |
| [28 – Stock Exchange](./28.%20Stock%20Exchange/) | The sequencer | A total order cannot be sharded |

The sharpest version: **when the thing you would be splitting is the thing being protected, you cannot split it.** Counting a viral ad salts cleanly; a bank balance does not.

---

## 5. Does the shard key contain the transaction?

Sharding is easy when every operation touches exactly one shard, and painful the moment one operation crosses a boundary — because that is precisely what a shard boundary is designed to prevent.

**The question to ask, before proposing any shard key:** *name the operations, and check whether each stays inside one shard.*

| Chapter | Shard key | Contained? | Consequence |
|---|---|---|---|
| [22 – Hotel](./22.%20Hotel%20Reservation%20System/#scalability) | `hotel_id` | **Yes** — a booking never spans hotels | Keeps ACID transactions while scaling out |
| [23 – Email](./23.%20Distributed%20Email%20Service/#metadata-database) | `user_id` | **Yes** — every mail operation is one mailbox | Simple; but no shared mailboxes |
| [15 – Google Drive](./15.%20Google%20Drive/#gotchas--failure-modes) | `user_id` | **No** — a shared file spans two users | Sharing is what makes the metadata store hard |
| [24 – Object Storage](./24.%20S3-like%20Object%20Storage/#listing-objects-in-a-bucket) | `hash(bucket, object)` | Yes for lookup, **no for listing** | A second, differently-sharded listing table |
| [9 – Web Crawler](./09.%20Web%20Crawler/#url-frontier) | **Host**, not URL | Politeness state is per host | Sharding by URL would break the rate limit |

Chapter 9 is the instructive one: partitioning the frontier by URL looks natural and is wrong, because every node would stay under its own per-host limit while collectively hammering the host. **The shard key has to contain the thing being enforced, not just the data.**

---

## 6. Cheap over-approximation, then an exact check

Narrow a huge candidate set with something fast and imprecise, then pay for precision only on the survivors. The art is being explicit about **which direction the error goes** — and making sure the harmless direction is the one that happens.

| Chapter | Cheap filter | Error direction | Exact check |
|---|---|---|---|
| [6 – Key-Value Store](./06.%20Key-Value%20Store/) | Bloom filter | False positive = a wasted disk read | Read the SSTable |
| [8 – URL Shortener](./08.%20URL%20Shortener/#2-hash--collision-resolution) | Bloom filter on short keys | False positive = pick another key | Unique index |
| [9 – Web Crawler](./09.%20Web%20Crawler/#gotchas--failure-modes) | Bloom filter on seen URLs | **False positive = a page never crawled** | — (accepted, and measured) |
| [16 – Proximity](./16.%20Proximity%20Service/#option-3-geohash) | 9 geohash cells (a square) | Over-inclusive | Haversine distance filter |
| [18 – Google Maps](./18.%20Google%20Maps/#improvement---adaptive-eta-and-rerouting) | Coarse super-tile containment | False positive = one route checked needlessly | Exact route membership |
| [9 – Web Crawler](./09.%20Web%20Crawler/#avoiding-problematic-content) | SimHash fingerprint distance | Near-duplicate threshold | — |

Chapter 9's row is the one to remember: there, a false positive **silently drops content**, and nothing logs an error. A cheap filter is only safe if you know what its errors cost, which means knowing the rate.

---

## 7. A cache is only as good as how many requests share a key

Cache effectiveness is governed by **key cardinality**, not cache size. A key nobody else will ever request is not a cache entry; it is a memory leak with a TTL.

**The question to ask:** *how many requests can share this key?* If the answer is "about one", reduce the key's precision until it is more.

| Chapter | Bad key | Good key | Why |
|---|---|---|---|
| [16 – Proximity](./16.%20Proximity%20Service/#cache-strategy) | Raw GPS coordinates | **Geohash cell** | Everyone on a block shares one entry; GPS jitter stops mattering |
| [13 – Autocomplete](./13.%20Search%20Autocomplete/#multi-language-and-personalization-the-cache-key-problem) | `prefix + user` | **`prefix`** | Personalization makes the answer unshareable and unprecomputable |
| [14 – YouTube](./14.%20Youtube/) | — | Tile / segment URL | Immutable, so cacheable at every layer |
| [20 – Metrics](./20.%20Metrics%20Monitoring%20and%20Alerting%20System/#data-model) | Labels including `user_id` | Bounded label values | Cardinality is a *product*; one unbounded label kills the system |

Chapter 20 is the same lesson pointed at storage rather than caching: series count is the product of label cardinalities, memory scales with series count, and one high-cardinality label multiplies it by millions.

---

## 8. Time-ordered IDs cut both ways

Prefixing an identifier with a timestamp buys index locality, sortability and cursor pagination. It also makes every new write land next to every other new write.

| Benefit | Where |
|---|---|
| Index locality — inserts append instead of scattering | [7 – Unique ID](./07.%20Unique-Id%20Generator/#2-uuid-universally-unique-identifier) |
| Cursor pagination over a growing list | [11 – News Feed](./11.%20News%20Feed%20System/#reading-the-feed-end-to-end) |
| Merging two sources in time order | [11 – News Feed](./11.%20News%20Feed%20System/) (pushed + pulled posts) |
| Sync cursors — "everything after this" | [12 – Chat](./12.%20Chat%20System/#message-synchronization), [15 – Drive](./15.%20Google%20Drive/#notification-service) |

| Cost | Where |
|---|---|
| Range-sharding sends every write to the newest shard | [7 – Unique ID](./07.%20Unique-Id%20Generator/#gotchas--failure-modes) |
| Sequential key prefixes make a hot partition | [24 – Object Storage](./24.%20S3-like%20Object%20Storage/#gotchas--failure-modes) |
| k-sortable is **not** totally ordered — ties within a millisecond are arbitrary | [12 – Chat](./12.%20Chat%20System/#design) |
| The ID leaks creation time, volume, and enumerable neighbours | [8 – URL Shortener](./08.%20URL%20Shortener/#comparison) |

Chapter 12 is the subtle one: Snowflake IDs are *good enough* to paginate a feed and *not good enough* to order a conversation, so it uses a strictly-ordered per-channel counter instead. "Sortable" and "ordered" are different guarantees.

---

## 9. Picking a push channel — the book decides this four times

Four chapters choose how a server reaches a client, and they choose differently, because the traffic profiles differ. The comparison is worth holding as one table.

| | Short polling | Long polling | SSE | WebSocket |
|---|---|---|---|---|
| Direction | Client pulls | Client pulls, server holds | Server → client | **Both ways** |
| Overhead when idle | A request per interval | One held connection | One held connection | One held connection |
| Server state | None | One connection per client | One per client | One per client |
| Reconnection | Trivial | Built in | Automatic, with `Last-Event-ID` | **You implement it** |

| Chapter | Traffic profile | Choice |
|---|---|---|
| [12 – Chat](./12.%20Chat%20System/#choosing-the-receive-channel) | Continuous, both directions | **WebSocket** |
| [15 – Google Drive](./15.%20Google%20Drive/#notification-service) | Rare, server → client only | **Long polling** |
| [18 – Google Maps](./18.%20Google%20Maps/#delivery-protocols) | Frequent both ways *while navigating*, nothing otherwise | **WebSocket, session-scoped** |
| [17 – Nearby Friends](./17.%20Nearby%20Friends/) | Constant updates both ways | **WebSocket** |

And the related choice for *collecting* data, which has the opposite answer from what you might expect:

| Chapter | Direction | Why |
|---|---|---|
| [19 – Message Queue](./19.%20Distributed%20Message%20Queue/#consumer-flow) | Consumers **pull** | Consumers set their own rate and cannot be overwhelmed |
| [20 – Metrics](./20.%20Metrics%20Monitoring%20and%20Alerting%20System/#metrics-collection) | Collector **pulls** | **Absence becomes information** — a target that does not answer is down |

Chapter 20's reason is the one worth carrying: with pull you hold the list of what *should* exist, so silence is a signal. With push, silence is ambiguous.

---

## 10. Stateful tiers are the exception, and they cost

Almost everything in these notes is stateless and therefore boring to scale. The exceptions are memorable because they are where the operational pain lives.

| Chapter | What holds state | What it costs |
|---|---|---|
| [12 – Chat](./12.%20Chat%20System/#components) | Live WebSockets per device | Losing a server drops ~100k clients, who all reconnect at once |
| [17 – Nearby Friends](./17.%20Nearby%20Friends/#gotchas--failure-modes) | Sockets plus subscriptions | Reconnection is expensive — re-fetch friends, re-subscribe to hundreds of channels |
| [16 – Proximity](./16.%20Proximity%20Service/#operational-considerations) | Quadtree built in-process | Minutes of startup before a server can serve; staggered rollouts |
| [25 – Leaderboard](./25.%20Real-time%20Gaming%20Leaderboard/) | Redis as the system of record | Persistence and replication become correctness concerns |
| [27 – Digital Wallet](./27.%20%20Digital%20Wallet/) | Local event log | Node identity matters; restores take as long as replay |
| [28 – Stock Exchange](./28.%20Stock%20Exchange/) | Everything, on one machine | One failure domain; recovery is replay |

The shared consequences: **deploys become incidents** (every restart is a mass reconnection), clients need **jittered backoff** or recovery cascades, and servers need **draining** rather than termination. If a design has a stateful tier, those three belong in the answer.

---

## 11. Sometimes the business absorbs the inconsistency

Before engineering a hard guarantee, find out whether it is actually hard. Ask: **what does the business do today when this is violated?** Occasionally the answer is "we have a procedure", and the constraint is negotiable — which is enormously cheaper.

| Chapter | The constraint | Absorbable? |
|---|---|---|
| [22 – Hotel](./22.%20Hotel%20Reservation%20System/) | Never oversell rooms | **Yes** — overbook 10%, and walk the guest if it happens |
| [11 – News Feed](./11.%20News%20Feed%20System/) | Everyone sees the same feed | Yes — eventual consistency is invisible |
| [20 – Metrics](./20.%20Metrics%20Monitoring%20and%20Alerting%20System/) | Exact counts | Yes — approximate is fine, and cheaper |
| [17 – Nearby Friends](./17.%20Nearby%20Friends/) | Deliver every location update | **Yes, explicitly** — and that one sentence licenses the entire design |
| [27 – Digital Wallet](./27.%20%20Digital%20Wallet/) | Money is never created or destroyed | **No** |
| [26 – Payments](./26.%20Payment%20System/) | Never double-charge | **No** |

Chapter 17 is the clearest case: "occasional data point loss is acceptable" is what permits fire-and-forget pub/sub, no acknowledgements, no retries and TTL-based presence. Remove that sentence and the design has to become [Chapter 19](./19.%20Distributed%20Message%20Queue/).

---

## 12. Detect-and-correct, when you cannot prevent

When an operation spans systems that share no transaction — your database, a third-party API, a bank — you cannot make them consistent. You can guarantee that divergence is **found and fixed within a bounded time**, and that is a real guarantee rather than a consolation.

| Chapter | What cannot be made atomic | The detection mechanism |
|---|---|---|
| [26 – Payments](./26.%20Payment%20System/#reconciliation) | Your DB, the PSP, the bank | Nightly settlement-file reconciliation; ledger-vs-wallet checks |
| [21 – Ad Clicks](./21.%20Ad%20Click%20Event%20Aggregation/#data-monitoring-and-correctness) | Streaming aggregation vs reality | End-of-day batch recomputation — the **authoritative** number |
| [27 – Digital Wallet](./27.%20%20Digital%20Wallet/) | Shards in a distributed transfer | Replay from the event log; reconciliation at external boundaries |
| [6 – Key-Value Store](./06.%20Key-Value%20Store/#5-handling-failures) | Replicas during a partition | Merkle-tree anti-entropy and read repair |

The reframing that matters: in these systems **reconciliation is the correctness mechanism, not a cleanup chore.** And a growing "unclassifiable mismatch" bucket is the clearest early warning that a failure mode exists which nobody has modelled.

---

## 13. Scale out is an answer to one kind of constraint

Twenty-seven chapters scale *out*, because their constraint is volume. [Chapter 28](./28.%20Stock%20Exchange/) scales *in* — one machine, one pinned thread, shared memory, no disk, no locks — because its constraint is the latency of a single decision, and **one network round trip costs more than its entire budget.**

Worth re-reading [Chapter 1](./01.%20Scaling/) against [Chapter 28](./28.%20Stock%20Exchange/) once. The contrast makes the point better than either does alone: distribution is a technique for a particular problem, not a measure of sophistication. When the budget is microseconds, every distributed-systems instinct in this book is a liability.

---

## Using this page

In an interview, after gathering requirements and doing the estimation:

1. **Name the pattern.** "This is a fan-out problem." "This is an immutable-log-plus-projection problem." That sentence organises everything after it.
2. **Ask the pattern's question.** How skewed is the distribution? Which of these cannot be regenerated? Does the shard key contain the transaction? What does the business do when this is violated?
3. **Expect the pattern's failure modes**, because they recur too: hot keys, duplicate delivery, replay cost, cache keys that nobody shares, stateful tiers and reconnection storms.

And the most transferable habit in these notes: **state what each decision costs you, not just what it buys.** A design presented as a sequence of problems and their prices reads as understanding; the same design presented as a diagram reads as recall.

## Where to go next
- [Chapter 3 – A Framework For System Design Interviews](./03.%20System%20Design%20Framework/) — the process these patterns plug into.
- [Chapter 2 – Back-of-the-envelope Estimation](./02.%20Back%20Of%20the%20Envelope%20Estimation/) — the arithmetic that tells you which pattern you are in.
- [Chapter 1 – Scale From Zero To Millions Of Users](./01.%20Scaling/) — where most of these patterns first appear, in miniature.
