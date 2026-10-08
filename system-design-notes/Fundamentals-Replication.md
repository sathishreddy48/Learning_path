# Replication, Quorums and Consensus

## Introduction
Replication is why distributed systems survive machine failure, and it is also the source of nearly every hard problem in them. This page covers the three mechanisms that keep copies in agreement — leader-based replication, quorums, and consensus protocols — and the failure modes each one leaves open.

**The one-sentence version:** replication is easy until two replicas disagree, and the entire field is about who decides which one is right — a designated leader, a majority vote, or the reader at read time.

This underpins the partitioning in [Chapter 5](../05.%20Consistent%20Hashing/) and [Chapter 6](../06.%20Key-Value%20Store/), and it is where "what happens when the primary dies?" leads in any chapter.

## Leader-based replication

### Explanation
One replica is the leader; all writes go through it, and it ships its changes to followers. This is what PostgreSQL, MySQL, Kafka partitions and most message brokers do, and it is the default worth proposing first because it makes write ordering trivial: the leader's order *is* the order.

The design choice inside it is when the leader acknowledges a write.

| Mode | Leader acks after | Loses data on leader failure? | Write latency |
|---|---|---|---|
| **Asynchronous** | Writing locally | Yes — anything not yet shipped | Lowest |
| **Semi-synchronous** | One follower confirms | Only if both fail together | One extra round trip |
| **Synchronous (all)** | Every follower confirms | No | Slowest follower sets the pace |
| **Quorum** | A majority confirms | No, if failover picks a quorum member | Median follower sets the pace |

Fully synchronous replication to *all* followers is almost never used: one slow or dead follower stalls every write. Quorum acknowledgement is the usual compromise — durable against a minority failing, and paced by the median rather than the worst replica.

### Failover, and what it costs
When the leader dies, something must choose a new one. That is harder than it sounds, and the problems are worth naming:

- **Detecting the failure.** You cannot distinguish a dead leader from a slow one or an unreachable one. Timeouts are a guess; too short causes spurious failovers, too long means a long outage.
- **Lost writes.** With asynchronous replication, writes the old leader acknowledged but never shipped are gone. If the old leader rejoins, it must discard them — and if those writes were visible to users, the system has silently lost acknowledged data.
- **Split brain.** The old leader may not know it was replaced and keeps accepting writes. Now there are two leaders and two divergent histories.

> **Fencing is the standard defence:** every leadership term gets a monotonically increasing number (an epoch, term or fencing token). Followers and storage reject any request carrying a number older than the highest they have seen, so a deposed leader's writes are refused even if it still believes it is in charge. This is the single most useful mechanism to be able to name when asked about split brain — it converts "we hope the old leader notices" into a guarantee enforced by the receivers.

## Quorums

### Explanation
With `N` replicas, require `W` to acknowledge a write and `R` to answer a read. If `R + W > N`, every read quorum overlaps every write quorum by at least one replica, so a read is guaranteed to *see* at least one copy of the most recent write.

Common settings:

- `N=3, W=2, R=2` — the standard balanced choice. Tolerates one replica down for both reads and writes.
- `N=3, W=3, R=1` — fast reads, writes fail if any replica is down.
- `N=3, W=1, R=1` — fast everything, no overlap guarantee, eventual consistency.

The knobs let you move latency between the read and write path without changing durability, which is the real reason the model is popular.

### What quorums do not give you
Overlap means the read *touches* a replica with the newest value. It does not tell you *which* of the values returned is newest, and that is a separate problem:

- **You need versioning.** Each value carries a version (a logical clock, a vector clock, or a wall-clock timestamp if you are willing to accept its flaws). Without it, "newest" is undefined.
- **Concurrent writes can both succeed.** Two writes to disjoint quorums can both reach `W` replicas. Now there are two versions and no ordering between them; something has to merge or pick.
- **Reads can go backwards.** A read hitting a different quorum next time may return an older value, unless read repair or a session guarantee prevents it.

The gap is closed by two background mechanisms worth naming:

- **Read repair** — when a read sees replicas disagree, it writes the winning value back to the stale ones. Cheap, but only fixes keys someone actually reads.
- **Anti-entropy** — a background process comparing replicas and reconciling differences, usually with Merkle trees so the comparison is cheap. Fixes cold keys that read repair never touches.

> **Interview angle:** if you propose quorums, be ready for "so is it strongly consistent?" The accurate answer is no, not by itself — `R + W > N` gives overlap, and you still need versioning plus a deterministic conflict rule, and even then you do not get linearizability without consensus for the ordering. Candidates who state `R + W > N` as if it settled the question get pushed on it; candidates who volunteer the gap and then name read repair and anti-entropy as the practical patches are demonstrating the thing the question is testing.

## Consensus

### Explanation
Consensus protocols — Paxos, and Raft, which is Paxos reorganised to be teachable — solve the hardest version of the problem: get a group of nodes to agree on an ordered log of entries, such that every node applies the same entries in the same order, even when some crash and the network drops and reorders messages.

That is enough to build anything. A replicated state machine over an agreed log gives you a linearizable database, a lock service, or leader election for everything else.

### Raft in the shape you should be able to describe
Raft splits the problem into three pieces:

1. **Leader election.** Time is divided into *terms*. A follower that hears nothing from a leader becomes a candidate, increments the term and asks for votes. A node grants at most one vote per term, so a candidate winning a majority is unique. Randomised election timeouts stop candidates from repeatedly splitting the vote.
2. **Log replication.** The leader appends entries and sends them to followers. Once a majority has stored an entry it is *committed* and can be applied. Followers that have diverged are overwritten from the leader — the leader's log is authoritative by construction.
3. **Safety.** A node only votes for a candidate whose log is at least as up to date as its own. This guarantees a new leader already holds every committed entry, so committed entries are never lost.

Two consequences worth stating:

- **A majority is required to make progress.** With 5 nodes you tolerate 2 failures; with 3 you tolerate 1. An even cluster size buys nothing — 4 nodes tolerate the same single failure as 3 — which is why clusters are odd-numbered.
- **Consensus is expensive, so you use it sparingly.** Systems do not run every write through Raft. They run *metadata* through it — who is the leader for this shard, which nodes hold which range — and let the data path use cheaper replication underneath. That division is the practical answer to "would you use Raft here?"

### Leases, the cheap approximation
A lease is a lock with an expiry: a node is granted leadership for a bounded period and must renew. It makes leadership cheap to check — no quorum round trip, just look at the clock — at the cost of depending on bounded clock drift between the grantor and the holder.

> **The subtlety worth knowing:** leases trade a correctness guarantee for latency, and the trade is only sound if clock drift stays within the margin you assumed. A holder whose clock runs slow may believe its lease is live after it has expired elsewhere — which is split brain again, arriving through the clock rather than the network. The standard defence is the same as before: pair the lease with a fencing token so stale holders are rejected by whoever receives their writes. This is a good example of why the [time and ordering page](Fundamentals-Time-And-Order.md) matters for correctness and not just for ordering.

## Choosing between them

| You need | Reach for | Because |
|---|---|---|
| Ordered writes, simple reasoning | Single leader | The leader's order is the order |
| Survive leader failure without losing writes | Quorum acknowledgement | Majority holds every acked write |
| Tunable read/write latency | Quorums with R, W | Move cost between the paths |
| Agreement on metadata, leader election | Raft / Paxos | The only thing that actually solves it |
| Cheap leadership checks | Leases + fencing tokens | No quorum round trip per check |
| Maximum availability, writes always accepted | Leaderless + conflict resolution | No leader to lose |

> **Interview angle:** the move that lands here is scoping consensus to where it earns its cost. "I would run Raft for the control plane — shard assignment and leader election — and use leader-based replication with quorum acks for the data path, so a write costs one round trip to a majority rather than a full consensus round" is a complete, defensible architecture in one sentence, and it shows you know consensus is a tool rather than a layer. The follow-up is usually "how many nodes?", and the answer is odd-numbered, 3 or 5, because an even cluster tolerates no more failures than the odd one below it.

## Where to go next
- [Consistency models, CAP and PACELC](Fundamentals-Consistency.md) — what these mechanisms are buying.
- [Time, ordering and idempotency](Fundamentals-Time-And-Order.md) — versioning, and why wall clocks mislead.
- [Chapter 6: Key-Value Store](../06.%20Key-Value%20Store/) — quorums, versioning and anti-entropy in one design.
