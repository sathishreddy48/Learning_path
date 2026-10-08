/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   Topics are organised into groups (sidebar menus). Within a group they are in
   study order; numbering on the site is global across groups. `id` is the
   localStorage key for visited state — never rename an id once you have used
   the site. Loaded via <script src>, never fetch(), so the site works over
   file://. CURRICULUM.topics is derived below as the flat, ordered list.

   This site's visited state is namespaced `lld.v1.*`, separate from the C#,
   System Design and DSA sites, so the progress bars never mix.
   ========================================================================== */

window.CURRICULUM = {
  "meta": {
    "title": "LLD",
    "subtitle": "Low-level design · C# with Python alongside"
  },
  "groups": [
    {
      "id": "foundations",
      "label": "Foundations",
      "blurb": "How the round is scored and how to run its clock, then the handful of patterns that answer almost every prompt — and the injection that makes any of it testable.",
      "topics": [
        {
          "id": "lld-round",
          "label": "The LLD Round",
          "href": "topics/lld-round.html",
          "blurb": "What this round grades and how it differs from system design: the 45-minute timetable, the clarifying questions that change the model, nouns into classes with real invariants, and the failure modes that sink candidates.",
          "sections": [
            {
              "hash": "#what-is-graded",
              "label": "What the round actually is, and what it grades"
            },
            {
              "hash": "#the-clock",
              "label": "Running the 45 minutes"
            },
            {
              "hash": "#requirements",
              "label": "Clarifying: the questions that change the design"
            },
            {
              "hash": "#nouns-to-classes",
              "label": "From nouns to classes: responsibilities and invariants"
            },
            {
              "hash": "#diagram",
              "label": "The diagram: what to draw, and how little is enough"
            },
            {
              "hash": "#common-mistakes",
              "label": "The failure modes, and what to do instead"
            }
          ]
        },
        {
          "id": "lld-principles",
          "label": "Principles & Patterns Under Pressure",
          "href": "topics/lld-principles.html",
          "blurb": "The six patterns that actually come up and the wording that signals each; Strategy and State worked in full; constructor injection, fake clocks, and what to say when asked how you would test it.",
          "sections": [
            {
              "hash": "#which-patterns",
              "label": "The patterns that actually come up — and the ones that do not"
            },
            {
              "hash": "#strategy",
              "label": "Strategy: the workhorse"
            },
            {
              "hash": "#state",
              "label": "State machines: the second most useful shape"
            },
            {
              "hash": "#seams",
              "label": "Dependency injection and testability"
            }
          ]
        }
      ]
    },
    {
      "id": "worked-designs",
      "label": "Worked designs",
      "blurb": "Five prompts end to end — requirements, model, complete code, concurrency, and the follow-ups each one attracts. Every implementation here is executed and tested.",
      "topics": [
        {
          "id": "lld-parking-lot",
          "label": "Parking Lot",
          "href": "topics/lld-parking-lot.html",
          "blurb": "The canonical warm-up: whether a small vehicle may use a large spot, invariants that live next to their data, two seams that absorb every follow-up, and the check-then-act race behind \"multiple entrances\".",
          "sections": [
            {
              "hash": "#scope",
              "label": "Requirements: what to ask and what to rule out"
            },
            {
              "hash": "#model",
              "label": "The model"
            },
            {
              "hash": "#code",
              "label": "The implementation"
            },
            {
              "hash": "#concurrency",
              "label": "Concurrency: where the races actually are"
            },
            {
              "hash": "#followups",
              "label": "The follow-ups, and how each one lands"
            }
          ]
        },
        {
          "id": "lld-elevator",
          "label": "Elevator Bank",
          "href": "topics/lld-elevator.html",
          "blurb": "Hall calls and car calls are different things; a bank needs dispatch as well as scheduling; the LOOK sweep every real lift uses; tick-driven so the whole thing stays deterministic and testable.",
          "sections": [
            {
              "hash": "#scope",
              "label": "Requirements: the two questions that matter"
            },
            {
              "hash": "#model",
              "label": "The model: a car is a state machine, the bank is a dispatcher"
            },
            {
              "hash": "#code",
              "label": "The implementation"
            },
            {
              "hash": "#followups",
              "label": "Follow-ups and the hard parts"
            }
          ]
        },
        {
          "id": "lld-vending-machine",
          "label": "Vending Machine",
          "href": "topics/lld-vending-machine.html",
          "blurb": "The State pattern with illegal transitions you choose on purpose — plus change-making, where greedy is wrong in two different ways once the coin float is finite.",
          "sections": [
            {
              "hash": "#scope",
              "label": "Requirements, and why this one is really two problems"
            },
            {
              "hash": "#states",
              "label": "The state machine"
            },
            {
              "hash": "#change",
              "label": "Making change: greedy, and when greedy is wrong"
            },
            {
              "hash": "#machine",
              "label": "The machine, and the follow-ups"
            }
          ]
        },
        {
          "id": "lld-splitwise",
          "label": "Splitwise",
          "href": "topics/lld-splitwise.html",
          "blurb": "Append-only history with derived pairwise balances, cents rather than floats, splits that sum exactly by largest-remainder apportionment, and a settle-up that is NP-hard before it is greedy.",
          "sections": [
            {
              "hash": "#scope",
              "label": "Requirements, and the modelling decision that defines the design"
            },
            {
              "hash": "#model",
              "label": "The model: expenses in, balances out"
            },
            {
              "hash": "#code",
              "label": "The implementation"
            },
            {
              "hash": "#settle",
              "label": "Settle up: minimising the number of transactions"
            }
          ]
        },
        {
          "id": "lld-cache-rate-limiter",
          "label": "Cache & Rate Limiter",
          "href": "topics/lld-cache-rate-limiter.html",
          "blurb": "An O(1) LRU derived rather than recalled, why a reader-writer lock buys nothing when every read is a write, eviction and TTL behind interfaces, and four rate-limiting algorithms with what each gets wrong.",
          "sections": [
            {
              "hash": "#lru",
              "label": "The LRU cache: O(1) in both directions"
            },
            {
              "hash": "#threadsafe",
              "label": "Making it thread-safe — and why one lock is usually the right answer"
            },
            {
              "hash": "#policies",
              "label": "TTL and pluggable eviction"
            },
            {
              "hash": "#rate-limiter",
              "label": "Rate limiters: the same design muscle, a different policy"
            }
          ]
        }
      ]
    }
  ]
};

/* Flat list in study order — what nav.js, visited.js and the dashboard iterate. */
window.CURRICULUM.topics = window.CURRICULUM.groups.reduce(function (acc, g) {
  g.topics.forEach(function (t) { t.group = g.id; t.groupLabel = g.label; acc.push(t); });
  return acc;
}, []);
