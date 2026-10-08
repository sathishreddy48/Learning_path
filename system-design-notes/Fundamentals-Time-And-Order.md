# Time, Ordering and Idempotency

## Introduction
Distributed systems have no shared clock and no global "now". Every ordering question — which write won, did this happen before that, is this message a duplicate — has to be answered without one. This page covers the clocks that work, the one that does not, and the idempotency that makes the whole problem tractable in practice.

**The one-sentence version:** wall-clock timestamps are not an ordering mechanism, logical clocks are, and the practical escape hatch for most systems is to stop caring about order by making operations idempotent.

This sits underneath the deduplication in [Chapter 19](../19.%20Distributed%20Message%20Queue/), the correctness arguments in [Chapter 26](../26.%20Payment%20System/), and the windowing in [Chapter 21](../21.%20Ad%20Click%20Event%20Aggregation/).

## Why wall clocks fail

### Explanation
Each machine has its own quartz clock, drifting at its own rate, periodically corrected by NTP. Three consequences make wall-clock timestamps unsafe for ordering:

- **Drift.** Typical NTP-synced machines stay within a few milliseconds of each other, but tens or hundreds of milliseconds is routine under load, and worse is possible. Any two events closer together than the drift cannot be ordered by timestamp.
- **Jumps.** NTP corrections move the clock, sometimes backwards. A `now()` call can return a value earlier than a previous one on the same machine. Leap seconds historically caused the same effect, spectacularly.
- **No causality.** Even with perfect clocks, equal or near-equal timestamps say nothing about which event *caused* which.

> **The concrete failure to have ready:** last-write-wins keyed on wall clock means the write from the machine with the fastest clock wins, regardless of when it actually happened. A user updates their profile, then corrects a typo a second later from another device — if the first device's clock is 2 seconds ahead, the correction is silently discarded and never comes back. The data is not corrupted in any way a checksum would catch; it is just wrong, and the system will insist it is right.

### What a monotonic clock is for
Most languages expose two clocks. The wall clock (`DateTime.UtcNow`, `time.time()`) can jump and is the only one meaningful across machines. The monotonic clock (`Stopwatch`, `time.monotonic()`) never goes backwards but has no meaning outside the process.

The rule: **measure durations with the monotonic clock, express points in time with the wall clock, and order events with neither.** Timeouts and latency measurements taken from the wall clock will occasionally produce negative durations or hour-long stalls, and that bug is miserable to find.

## Logical clocks

### Explanation
Logical clocks abandon real time and track causality directly.

**Lamport timestamps** are a single counter per node. On any local event, increment. On sending a message, attach the counter. On receiving, set the counter to `max(local, received) + 1`.

This guarantees: if `a` happened-before `b`, then `L(a) < L(b)`. The converse does **not** hold — a smaller timestamp does not prove causality, because concurrent events get arbitrary values. Lamport timestamps give you a *total order* that is consistent with causality, which is enough to break ties deterministically but not enough to detect conflicts.

**Vector clocks** fix the converse. Each node keeps a vector of counters, one per node, incrementing its own entry on an event and taking the element-wise maximum on receipt. Now comparing two vectors tells you exactly one of three things:

- `V(a) < V(b)` on every element → `a` happened before `b`.
- `V(b) < V(a)` on every element → `b` happened before `a`.
- Neither → **concurrent**, and the system must decide what that means.

That third outcome is the whole point. Vector clocks let a system *detect* a conflict rather than silently resolve it the wrong way — which is how Dynamo-style stores know to return multiple versions ("siblings") to the application instead of picking one.

The cost is size: a vector grows with the number of nodes that have ever written to a key, and pruning it safely is fiddly. That is why vector clocks appear in systems with a bounded set of writers and are avoided elsewhere.

### Hybrid logical clocks and TrueTime
Two practical refinements worth naming:

**Hybrid logical clocks (HLC)** combine a wall-clock component with a logical counter. They stay close to real time, so timestamps remain human-meaningful and comparable across systems, while the logical part guarantees monotonicity and causality even when the wall clock misbehaves. This is the pragmatic modern default — CockroachDB and MongoDB both use them.

**TrueTime** is Spanner's approach: instead of pretending the clock is exact, expose the uncertainty. `TT.now()` returns an *interval* `[earliest, latest]` guaranteed to contain the true time, kept narrow (single-digit milliseconds) by GPS and atomic clocks in every datacentre. To commit a transaction, Spanner simply *waits out the uncertainty* — it delays until the interval has passed, so no later transaction can get an earlier timestamp.

> **Interview angle:** the insight to articulate about TrueTime is that it does not solve clock uncertainty, it *bounds and then pays for* it. Commit latency is deliberately increased by the clock uncertainty window, which buys externally consistent distributed transactions. That is a trade almost nobody else can make, because it requires special hardware in every datacentre — and saying so is the right level of detail. It also makes a nice general point: you can often convert an unbounded uncertainty into a bounded cost, and that is frequently the best available move.

## Delivery semantics and idempotency

### Explanation
Every messaging and RPC system offers one of three guarantees, and only two of them are real.

| Semantics | Mechanism | You get | Cost |
|---|---|---|---|
| **At-most-once** | Fire and forget | Loss on failure | Cheapest |
| **At-least-once** | Retry until acknowledged | Duplicates | Receiver must cope |
| **Exactly-once** | Does not exist on the wire | — | — |

The third row is the important one. **Exactly-once delivery is impossible** in the presence of network failures: a sender that does not receive an acknowledgement cannot distinguish "the message was lost" from "the message arrived and the acknowledgement was lost", so it must either retry (risking a duplicate) or not (risking a loss).

What systems *do* provide is **exactly-once processing**, which is at-least-once delivery plus an idempotent receiver. The duplicates still arrive; they just stop mattering. Kafka's "exactly-once semantics" is precisely this — producer sequence numbers plus transactional writes — and being able to say so is a reliable way to show you understand the guarantee rather than the marketing.

### Making an operation idempotent
Four mechanisms, roughly in order of how often they are the answer:

- **Idempotency keys.** The client generates a unique key per logical operation and sends it with every retry. The server records processed keys and returns the stored result for a repeat. This is what Stripe does for payments, and it is the right default answer for any request that moves money or creates a resource.
- **Natural idempotence.** Design the operation so repeating it is harmless: `SET status = 'paid'` rather than `INCREMENT attempts`. Absolute operations are idempotent, relative ones are not.
- **Deduplication windows.** Keep recently-seen message ids in a store with a TTL and drop repeats. Cheap, but only correct if duplicates always arrive within the window — so the window has to exceed the maximum possible retry delay, and you should say what you think that is.
- **Conditional writes / compare-and-set.** Attach an expected version; the write fails if the version moved. Also solves lost updates, and it is the same mechanism as the optimistic locking in [Chapter 22](../22.%20Hotel%20Reservation%20System/).

> **The transactional outbox:** the common failure is writing to a database and then publishing an event — if the process dies between them, the event is lost and the two systems diverge forever. The fix is to write the event into an `outbox` table *in the same transaction* as the state change, and have a separate relay read the outbox and publish. The relay publishes at-least-once, so consumers must still be idempotent, but the event can no longer be lost. This pattern is the standard answer to "how do you keep your database and your message queue consistent?" and it comes up constantly in microservices discussions.

## Event time versus processing time

### Explanation
Any system that aggregates a stream has to choose which clock its windows are keyed on.

**Processing time** is when your system saw the event. Simple, always available, and wrong whenever events are delayed — a mobile client that was offline for an hour dumps its backlog into the current window, inflating it and leaving the real window empty.

**Event time** is when the event actually happened, carried in the event itself. Correct, but you can never be sure you have received everything for a window, because a straggler may still be in flight.

The reconciliation is a **watermark**: an assertion that no event older than time `T` will arrive from now on. Windows older than the watermark can be closed and emitted; events arriving after it are *late*, and the system needs a policy — drop them, emit a correction, or hold windows open longer and accept the latency.

> **Interview angle:** this comes up in any streaming or analytics design, and the discriminating question is "what do you do with late data?" There is no universally right answer, and the interviewer wants to hear you choose a trade: drop it (simplest, slightly wrong counts), emit a retraction (correct, but downstream consumers must handle corrections), or widen the window (correct, costs latency and memory). Naming the three and picking one for a stated reason is the complete answer. The related move is to keep the raw event log so that any window can be recomputed later — which is the reasoning behind the lambda and kappa architectures in [Chapter 21](../21.%20Ad%20Click%20Event%20Aggregation/).

## Where to go next
- [Replication and consensus](Fundamentals-Replication.md) — versioning, and where leases depend on clocks.
- [Consistency models, CAP and PACELC](Fundamentals-Consistency.md) — the guarantees this ordering supports.
- [Chapter 19: Distributed Message Queue](../19.%20Distributed%20Message%20Queue/) — delivery semantics made concrete.
