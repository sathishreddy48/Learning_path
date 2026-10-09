# Consistency Models, CAP and PACELC

## Introduction
Every design in these notes makes a consistency choice, usually in one word — "eventually consistent", "strongly consistent", "we use quorums". This page is about what those words actually promise, because the follow-up question in an interview is almost never "which do you pick?" and almost always "what exactly does that give the user, and what breaks without it?"

**The one-sentence version:** a consistency model is a contract about *what a read is allowed to return*, strong models let you reason about the system as if it were a single machine, weak models give that up in exchange for staying available and fast, and almost every real system sits somewhere in the middle on purpose.

This is theory the designs assume rather than state. It sits underneath [Chapter 6](../06.%20Key-Value%20Store/) especially, and it is where the "what if a region goes down?" follow-up to any of the later design chapters ends up.

## The hierarchy, strongest to weakest

### Explanation
The models form a rough ladder. Each rung permits everything the rungs below it permit, plus guarantees of its own — so the higher you climb, the easier your system is to reason about and the more it costs in latency and availability.

| Model | A read returns | Costs | Typical home |
|---|---|---|---|
| **Linearizable** (strong) | The most recent completed write, as if there were one copy | A round trip to a quorum or a leader; unavailable during partitions | etcd, ZooKeeper, Spanner, a single-leader RDBMS |
| **Sequential** | Some interleaving all clients agree on, but not necessarily real-time order | Cheaper than linearizable; no wall-clock guarantee | Rarely offered by name |
| **Causal** | Anything, as long as cause precedes effect | Metadata to track causality (vector clocks, dependencies) | COPS, MongoDB causal sessions |
| **Read-your-writes** | At least your own writes | Sticky routing, or read from the leader | Session guarantees almost everywhere |
| **Monotonic reads** | Never older than a read you already did | Stick a session to a replica | Session guarantees |
| **Eventual** | Any replica's value; converges if writes stop | Almost nothing | Cassandra/Dynamo defaults, DNS, CDNs |

### What linearizable actually means
Linearizability is a guarantee about *real time*: once a write completes, every subsequent read — by anyone, anywhere — sees it or something newer. It makes the distributed system indistinguishable from a single machine serving requests one at a time.

The cost is that "every subsequent read" means a reader cannot answer from a possibly stale local replica. It must confirm with a quorum or go to the leader. During a network partition, the side that cannot reach a quorum must refuse to answer rather than risk returning a stale value — which is exactly the unavailability CAP describes.

### Why eventual consistency is not one thing
"Eventually consistent" is close to contentless on its own: it promises only that if writes stop, replicas converge. It says nothing about how long, or what you see meanwhile — including values that go backwards.

> **Worth stating in an interview:** the session guarantees — read-your-writes, monotonic reads, monotonic writes, writes-follow-reads — are what make eventual consistency tolerable in practice, and they are cheap. A user who posts a comment and does not see it has a bug report, even though the system is behaving exactly as "eventually consistent" permits. Saying "eventually consistent, plus read-your-writes for the author's own session" is a far better answer than either extreme, and it is what most real products actually do.

## CAP, stated correctly

### Explanation
CAP is the most misquoted theorem in system design, and interviewers notice. The precise statement is narrow:

> **The actual theorem:** when a network **partition** (P) occurs, a distributed system must choose between **consistency** (C — here meaning linearizability) and **availability** (A — here meaning every non-failing node answers every request). It cannot have both.

Three corrections to the usual telling:

1. **You do not "pick two".** Partitions are a fact of networks, not a design option. You cannot choose not to have them; you choose what to do when one happens. So the real choice is C or A, and only during a partition.
2. **"Consistency" in CAP is specifically linearizability**, not the C in ACID, which is about invariants holding across a transaction. They are different words that happen to be spelled the same.
3. **"Availability" is total** — *every* non-failing node must answer. A system that stays up for most users during a partition is not "available" in CAP's sense, which is why the label is less useful than it sounds.

### The two postures
A **CP** system refuses requests on the minority side of a partition rather than serve a possibly stale read. ZooKeeper, etcd and a leader-based database with synchronous replication behave this way: the minority side has no quorum, so it stops.

An **AP** system answers from whatever replica it can reach and reconciles later. Cassandra and Dynamo-style stores behave this way, which is why they need conflict resolution — last-write-wins, vector clocks, or CRDTs.

> **The example to have ready:** a shopping cart is the classic AP case, because a cart that refuses to accept an item costs a sale, while a cart that temporarily shows a stale item costs nothing much — and Dynamo's famous answer was to merge divergent carts, which at worst resurrects a deleted item. A bank ledger is the classic CP case: refusing a transfer is annoying, double-spending is a catastrophe. The two sit in the same company, which is the point — CAP is a per-operation choice, not a per-company one.

## PACELC: the half of the trade-off CAP leaves out

### Explanation
CAP only says anything about the partitioned case, which is rare. PACELC extends it to the normal case, which is always:

> **PACELC:** if there is a (P)artition, choose between (A)vailability and (C)onsistency; (E)lse — the rest of the time — choose between (L)atency and (C)onsistency.

The second clause is the one that governs your system almost all the time. Even with a perfectly healthy network, a linearizable read costs a round trip to a quorum or a leader — possibly cross-region. You pay that latency on every single request, partition or not. Choosing weaker consistency buys latency back.

| System | Partitioned | Normal operation | Reads as |
|---|---|---|---|
| Dynamo, Cassandra (defaults) | Availability | Latency | PA/EL |
| HBase, a single-leader RDBMS | Consistency | Consistency | PC/EC |
| Spanner | Consistency | Consistency (bought with TrueTime) | PC/EC |
| MongoDB (default write concern) | Consistency | Latency | PC/EL |

### Why this is the better framing
PACELC is more useful than CAP for interviews because it describes the trade-off you are *actually* making. "We will accept stale reads on the product catalogue because a cross-region quorum read would add 80ms to every page load, and the catalogue changes hourly" is a PACELC argument — it is about latency in the normal case, which is where the user experience lives.

> **Interview angle:** when asked "is this system CP or AP?", the strongest answer resists the label and goes per-operation: "the write path for payments is CP, because a double charge is unacceptable; the read path for the product catalogue is AP and served from cache, because 30 seconds of staleness is invisible and the latency win is large." Then add the PACELC half — what you are trading in the common case — because that is the part most candidates never mention and it is the part that actually determines the system's behaviour.

## Where the guarantee gets bought

### Explanation
Consistency is not a setting you turn on; it is a consequence of where reads and writes are routed and how many replicas must agree. Four common arrangements, roughly in order of strength:

- **Single leader, synchronous replication.** Writes go to the leader and are not acknowledged until replicas have them. Linearizable reads from the leader. Cost: leader throughput is a ceiling, and a leader failure means an election during which writes stop.
- **Quorums with R + W > N.** Any read quorum overlaps any write quorum, so a read sees at least one replica with the latest write. This is *necessary* for strong consistency but **not sufficient** on its own — see the warning below.
- **Leader with read replicas, asynchronous.** Fast reads, but replicas lag. Needs read-your-writes handling: route a user to the leader for a window after they write, or carry a version token.
- **Leaderless with conflict resolution.** Always writable, conflicts resolved at read time or by CRDTs. Weakest guarantee, highest availability.

> **R + W > N is not the whole story:** quorum overlap guarantees a read *touches* a replica holding the newest write, but it does not by itself guarantee the read *returns* it, nor that concurrent writes are ordered consistently. You still need a rule to pick the winner among the values returned — and if that rule is last-write-wins keyed on a wall clock, you have reintroduced the clock problems on the [time and ordering page](Fundamentals-Time-And-Order.md). Real quorum systems add read repair, versioning and sometimes a consensus protocol on top. Saying "R + W > N, therefore strongly consistent" is a common and visible oversimplification.

### The pragmatic position
Most production systems are deliberately inconsistent in most places and strongly consistent in a few. The skill being tested is not picking a model for the whole system — it is identifying *which operations* need the strong guarantee and confining the cost to them.

> **Interview angle:** the question behind the question is always "what does the user see when it goes wrong?" Answer in those terms. "If this read is stale the user sees a like count that is a few seconds behind, which nobody will notice" justifies eventual consistency far better than any amount of theory. "If this read is stale we sell the same seat twice" justifies the expensive path. Candidates who argue from the user-visible failure rather than from the model names are consistently rated higher, because that is how the decision is actually made.

## Where to go next
- [Replication and consensus](Fundamentals-Replication.md) — how replicas agree, and what a quorum actually buys.
- [Time, ordering and idempotency](Fundamentals-Time-And-Order.md) — why last-write-wins is harder than it looks.
- [Chapter 6: Key-Value Store](../06.%20Key-Value%20Store/) — these trade-offs made concrete in one design.
