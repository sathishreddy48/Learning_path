/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   Topics are organised into groups (sidebar menus). Within a group they are in
   study order; numbering on the site is global across groups. `id` is the
   localStorage key for visited state — never rename an id once you have used
   the site. Loaded via <script src>, never fetch(), so the site works over
   file://. CURRICULUM.topics is derived below as the flat, ordered list.

   This site's visited state is namespaced `playbook.v1.*`, separate from the
   C#, System Design, DSA and LLD sites, so the progress bars never mix.
   ========================================================================== */

window.CURRICULUM = {
  "meta": {
    "title": "Interview Playbook",
    "subtitle": "The process around the four technical tracks"
  },
  "groups": [
    {
      "id": "process",
      "label": "The process",
      "blurb": "What actually happens from application to decision, and what each stage is really filtering for — including the two rounds candidates prepare least for and the fact that the decision is made from written evidence.",
      "topics": [
        {
          "id": "playbook-pipeline",
          "label": "Before the Loop",
          "href": "topics/playbook-pipeline.html",
          "blurb": "Application, referral, recruiter screen and online assessment: what each filters for, how to write bullets you can defend in a deep-dive, the four questions to ask your recruiter, and why an OA rewards the opposite behaviour to an interview.",
          "sections": [
            {
              "hash": "#shape",
              "label": "The shape of the pipeline"
            },
            {
              "hash": "#resume",
              "label": "The résumé and the referral"
            },
            {
              "hash": "#screen",
              "label": "The recruiter screen"
            },
            {
              "hash": "#oa",
              "label": "Online assessments"
            }
          ]
        },
        {
          "id": "playbook-loop",
          "label": "The Loop",
          "href": "topics/playbook-loop.html",
          "blurb": "The five round types and how the weighting shifts by level; the four axes a coding round is scored on; how to prepare a project deep-dive; and the story bank the behavioural round is really asking for.",
          "sections": [
            {
              "hash": "#rounds",
              "label": "The five rounds a loop is built from"
            },
            {
              "hash": "#coding",
              "label": "The coding round, as a round"
            },
            {
              "hash": "#deep-dive",
              "label": "The project deep-dive"
            },
            {
              "hash": "#behavioural",
              "label": "The behavioural round"
            }
          ]
        },
        {
          "id": "playbook-levels",
          "label": "Levels & the Decision",
          "href": "topics/playbook-levels.html",
          "blurb": "The ladder every large company runs, what the mid-to-senior jump measures, how to calibrate yourself honestly, down-level risk and cooldowns — and what happens in the debrief after you leave.",
          "sections": [
            {
              "hash": "#ladder",
              "label": "What levels mean"
            },
            {
              "hash": "#targeting",
              "label": "Targeting a level, and down-level risk"
            },
            {
              "hash": "#decision",
              "label": "How the decision is actually made"
            }
          ]
        }
      ]
    },
    {
      "id": "preparing",
      "label": "Preparing",
      "blurb": "A schedule across all four tracks, and the one measurement that actually predicts how the loop will go.",
      "topics": [
        {
          "id": "playbook-plan",
          "label": "The Twelve-Week Plan",
          "href": "topics/playbook-plan.html",
          "blurb": "Four principles that decide whether any plan works, a week-by-week schedule with ratios that shift by phase and by target level, and a drill tracker built around the fraction of problems you can solve unaided.",
          "sections": [
            {
              "hash": "#principles",
              "label": "Four principles that decide whether the plan works"
            },
            {
              "hash": "#plan",
              "label": "The twelve-week plan"
            },
            {
              "hash": "#drill",
              "label": "The drill tracker"
            }
          ]
        }
      ]
    },
    {
      "id": "after",
      "label": "After the loop",
      "blurb": "Reading an offer properly, asking for more without an adversarial frame, and getting value out of a rejection.",
      "topics": [
        {
          "id": "playbook-offer",
          "label": "Offer & Negotiation",
          "href": "topics/playbook-offer.html",
          "blurb": "Base, equity, signing and bonus behave completely differently; why vesting schedules make headline numbers misleading; how to negotiate politely and what to ask for when money is fixed; and what to do with a rejection.",
          "sections": [
            {
              "hash": "#structure",
              "label": "How big-tech compensation is put together"
            },
            {
              "hash": "#negotiating",
              "label": "Negotiating"
            },
            {
              "hash": "#rejection",
              "label": "If it does not land"
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
