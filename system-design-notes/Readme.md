
# System Design Notes

**Note:** All 28 chapters are written up; wording and diagrams are still being refined. 


## How these notes are organized

Every chapter is written as more than a plain summary, using a few consistent conventions:

- **"What broke" / "What it now costs you"** — each design step is framed by the problem that forced it and the new problem it introduces, so a chapter reads as a causal story rather than a list of components.
- **Trade-off tables** — side-by-side comparisons instead of prose, for choices like vertical vs horizontal scaling or SQL vs NoSQL.
- **`Gotchas & failure modes`** — the things that bite in production: replication lag, cache stampede, hot shards, split-brain.
- **`> **Interview angle:**`** callouts — what an interviewer is usually probing for in that section.
- **Mermaid diagrams** alongside the reference images. These render on GitHub; where they don't render, the surrounding tables and prose carry the same information.
- **Self-check questions**, a glossary, and a one-table "problem → technique" summary at the end of each chapter.
- **Cross-links between chapters**, because the same few ideas recur: fan-out on write vs on read, an immutable log plus a derived view, idempotency instead of exactly-once delivery, and hot keys that partitioning cannot fix.

**All 28 chapters have now had this pass.** Chapters 5, 6 and 11 are good places to see the format at its fullest.

## Start here

- **[Recurring Patterns](./Patterns.md)** — an index of the dozen ideas that reappear across the 28 chapters: fan-out on write vs on read, an immutable log plus a derived view, at-least-once delivery with idempotent processing, hot keys that partitioning does not fix, and whether a shard key contains the transaction. Each entry links to the chapters that work the pattern through, so recognising one points you at where it is already covered.
- [Chapter 3 – A Framework For System Design Interviews](./03.%20System%20Design%20Framework/) — the process, and a one-page cheat sheet.
- [Chapter 2 – Back-of-the-envelope Estimation](./02.%20Back%20Of%20the%20Envelope%20Estimation/) — powers of two, latency numbers, and the estimation recipe.

## Distributed Fundamentals

These four pages cover the theory the designs above assume but rarely state — the material the
"what happens when a region goes down?" follow-up actually lands in.

- [Consistency Models, CAP and PACELC](Fundamentals-Consistency.md) — what each guarantee promises, CAP stated correctly, and the half of the trade-off CAP leaves out.
- [Replication, Quorums and Consensus](Fundamentals-Replication.md) — leader-based replication and failover, what `R + W > N` does and does not buy, Raft, and leases.
- [Time, Ordering and Idempotency](Fundamentals-Time-And-Order.md) — why wall clocks are not an ordering mechanism, Lamport and vector clocks, exactly-once as at-least-once plus idempotency, and event time versus processing time.
- [Storage Engines](Fundamentals-Storage-Engines.md) — write-ahead logs, B-trees versus LSM trees, compaction strategies, and the three amplifications.

## Chapters

 * [Chapter 1 - Scale From Zero To Millions Of Users](./01.%20Scaling/)
 * [Chapter 2 - Back-of-the-envelope Estimation](./02.%20Back%20Of%20the%20Envelope%20Estimation/)
 * [Chapter 3 - A Framework For System Design Interviews](./03.%20System%20Design%20Framework/)
 * [Chapter 4 - Design A Rate Limiter](./04.%20Rate%20Limiter//)
 * [Chapter 5 - Design Consistent Hashing](./05.%20Consistent%20Hashing/)
 * [Chapter 6 - Design A Key-Value Store](./06.%20Key-Value%20Store/)
 * [Chapter 7 - Design A Unique ID Generator In Distributed Systems](./07.%20Unique-Id%20Generator/)
 * [Chapter 8 - Design A URL Shortener](./08.%20URL%20Shortener/)
 * [Chapter 9 - Design A Web Crawler](./09.%20Web%20Crawler/)
 * [Chapter 10 - Design A Notification System](./10.%20Notification%20System/)
 * [Chapter 11 - Design A News Feed System](./11.%20News%20Feed%20System/)
 * [Chapter 12 - Design A Chat System](./12.%20Chat%20System/)
 * [Chapter 13 - Design A Search Autocomplete System](./13.%20Search%20Autocomplete/)
 * [Chapter 14 - Design YouTube](./14.%20Youtube/)
 * [Chapter 15 - Design Google Drive](./15.%20Google%20Drive/)
 * [Chapter 16 - Proximity Service](./16.%20Proximity%20Service/)
 * [Chapter 17 - Nearby Friends](./17.%20Nearby%20Friends/)
 * [Chapter 18 - Design Google Maps](./18.%20Google%20Maps/)
 * [Chapter 19 - Distributed Message Queue](./19.%20Distributed%20Message%20Queue/)
 * [Chapter 20 - Metrics Monitoring and Alerting System](./20.%20Metrics%20Monitoring%20and%20Alerting%20System/)
 * [Chapter 21 - Ad Click Event Aggregation](./21.%20Ad%20Click%20Event%20Aggregation/)
 * [Chapter 22 - Hotel Reservation System](./22.%20Hotel%20Reservation%20System/)
 * [Chapter 23 - Distributed Email Service](./23.%20Distributed%20Email%20Service/)
 * [Chapter 24 - S3-like Object Storage](./24.%20S3-like%20Object%20Storage/)
 * [Chapter 25 - Real-time Gaming Leaderboard](./25.%20Real-time%20Gaming%20Leaderboard/)
 * [Chapter 26 - Payment System](./26.%20Payment%20System/)
 * [Chapter 27 - Digital Wallet](./27.%20%20Digital%20Wallet/)
 * [Chapter 28 - Stock Exchange](./28.%20Stock%20Exchange/)


# Additonal Resources

### Rate Limiting
- [Circuit Breaker Algorithm](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Uber Rate Limiter](https://github.com/uber-go/ratelimit/blob/master/ratelimit.go)


### Consistent Hashing
- [Consistent Hashing](https://tom-e-white.com/2007/11/consistent-hashing.html)
- [CS168: Introduction and Consistent Hashing:]( http://theory.stanford.edu/~tim/s16/l/l1.pdf)
- [Apache Cassandra](http://www.cs.cornell.edu/Projects/ladis2009/papers/Lakshman-ladis2009.PDF)
- [Scaling Discord](https://blog.discord.com/scaling-elixir-f9b8e1e7c29b)
- [Google Maglev](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf)


### Key-Value Store
- [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
- [Cassandra Architecture](https://docs.datastax.com/en/archived/cassandra/3.0/cassandra/architecture/archIntro.html)
- [Google BigTable Architecture](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf)
- [Amazon Dynamo DB Internals](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html)
- [Design Patterns in Amazon Dynamo DB](https://www.youtube.com/watch?v=HaEPXoXVf2k)
- [Internals of Amazon Dynamo DB](https://www.youtube.com/watch?v=yvBR71D0nAQ)


### Unique-ID Generator
- [Ticket Servers: Distributed Unique Primary Keys on the Cheap](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap)
- [Snowflake](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake.html)


### Web Crawler
- [Web Crawling](http://infolab.stanford.edu/~olston/publications/crawling_survey.pdf)
- [Google Dynamic Rendering](https://developers.google.com/search/docs/guides/dynamic-rendering)



### Chat Systems
- [How Discord stores billions of messages](https://discord.com/blog/how-discord-stores-billions-of-messages)
- [Flannel: An Application-Level Edge Cache to Make Slack Scale](https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/)


### Search Autocomplete
- [How We Built Prefixy](https://medium.com/@prefixyteam/how-we-built-prefixy-a-scalable-prefix-search-service-for-powering-autocomplete-c20f98e2eff1)
- [Prefix Hash Tree](https://people.eecs.berkeley.edu/~sylvia/papers/pht.pdf)


### Youtube
- [YouTube Architecture](http://highscalability.com/youtube-architecture)
- [YouTube scalability 2012](https://www.youtube.com/watch?v=w5WVu624fY8)
- [Transcoding Videos at Scale](https://www.egnyte.com/blog/2018/12/transcoding-how-we-serve-videos-at-scale/)
- [Facebook Video Broadcasting](https://engineering.fb.com/ios/under-the-hood-broadcasting-live-video-to-millions/)
- [Netflix Video Encoding at Scale](https://netflixtechblog.com/high-quality-video-encoding-at-scale-d159db052746)
- [Netflix Shot based encoding](https://netflixtechblog.com/optimized-shot-based-encodes-now-streaming-4b9464204830)


### Google Drive
- [Differential Synchronization](https://neil.fraser.name/writing/sync/)
- [Differential Synchronization Video](https://www.youtube.com/watch?v=S2Hp_1jqpY8)
- [How We’ve Scaled Dropbox](https://www.youtube.com/watch?v=PE4gwstWhmc&feature=youtu.be)


### Proximity Service, Nearby Friends & Google Maps
- [Geohash Algorithm](https://www.movable-type.co.uk/scripts/geohash.html)
- [Google S2 Geometry](https://s2geometry.io/)
- [Uber H3 — hexagonal hierarchical spatial index](https://h3geo.org/)
- [Quadtree Indexing](https://en.wikipedia.org/wiki/Quadtree)


### Distributed Message Queue
- [Kafka design documentation](https://kafka.apache.org/documentation/#design)
- [The Log: What every software engineer should know about real-time data](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [KRaft — Kafka without ZooKeeper](https://developer.confluent.io/learn/kraft/)


### Metrics Monitoring and Alerting
- [Gorilla: A Fast, Scalable, In-Memory Time Series Database](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf)
- [Prometheus: instrumentation and naming](https://prometheus.io/docs/practices/naming/)
- [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)


### Ad Click Event Aggregation
- [Streaming 101 / 102 — event time, windows and watermarks](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/)
- [Flink: event time and watermarks](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/)


### Hotel Reservation, Payment System & Digital Wallet
- [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Pattern: Saga](https://microservices.io/patterns/data/saga.html)
- [Martin Fowler — Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [In Search of an Understandable Consensus Algorithm (Raft)](https://raft.github.io/raft.pdf)
- [Accounting for Developers](https://www.moderntreasury.com/journal/accounting-for-developers-part-i)


### Distributed Email Service
- [RFC 7208 — Sender Policy Framework](https://datatracker.ietf.org/doc/html/rfc7208)
- [RFC 6376 — DomainKeys Identified Mail](https://datatracker.ietf.org/doc/html/rfc6376)
- [RFC 7489 — DMARC](https://datatracker.ietf.org/doc/html/rfc7489)


### S3-like Object Storage
- [Erasure coding durability calculations (Backblaze)](https://github.com/Backblaze/erasure-coding-durability)
- [Amazon S3 strong consistency](https://aws.amazon.com/blogs/aws/amazon-s3-update-strong-read-after-write-consistency/)
- [Facebook f4: Warm BLOB storage](https://www.usenix.org/system/files/conference/osdi14/osdi14-paper-muralidhar.pdf)


### Real-time Gaming Leaderboard
- [Redis sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
- [Skip lists (Pugh, 1990)](https://15721.courses.cs.cmu.edu/spring2018/papers/08-oltpindexes1/pugh-skiplists-cacm1990.pdf)


### Stock Exchange
- [The LMAX Architecture (Martin Fowler)](https://martinfowler.com/articles/lmax.html)
- [LMAX Disruptor](https://lmax-exchange.github.io/disruptor/)
- [Latency numbers every programmer should know](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
