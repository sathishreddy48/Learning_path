/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   Topics are organised into groups (sidebar menus). Within a group they are in
   study order; numbering on the site is global across groups. `id` is the
   localStorage key for visited state — never rename an id once you have used
   the site. Loaded via <script src>, never fetch(), so the site works over
   file://. CURRICULUM.topics is derived below as the flat, ordered list.

   This site's visited state is namespaced `dsa.v1.*`, separate from the C# and
   System Design sites, so the three progress bars never mix.
   ========================================================================== */

window.CURRICULUM = {
  "meta": {
    "title": "DSA",
    "subtitle": "Interview patterns · C# with Python alongside"
  },
  "groups": [
    {
      "id": "foundations",
      "label": "Foundations",
      "blurb": "The framing you bring to every problem: how to run the interview, Big-O said out loud, and what each collection costs.",
      "topics": [
        {
          "id": "dsa",
          "label": "Foundations & Complexity",
          "href": "topics/dsa.html",
          "blurb": "How to run the 45 minutes, Big-O said out loud, the cost of every C# collection, recursion and stack depth, and the map from problem wording to pattern.",
          "sections": [
            {
              "hash": "#the-45-minutes",
              "label": "How to run the 45 minutes"
            },
            {
              "hash": "#big-o",
              "label": "Big-O: time, space, amortised — and how to say it"
            },
            {
              "hash": "#collection-costs",
              "label": "What every C# collection costs (and the Python equivalent)"
            },
            {
              "hash": "#arrays-vs-list",
              "label": "Arrays, List<T> and Span<T>"
            },
            {
              "hash": "#recursion-basics",
              "label": "Recursion, the call stack and depth limits"
            },
            {
              "hash": "#choosing",
              "label": "Reading the problem: which pattern is this?"
            }
          ]
        }
      ]
    },
    {
      "id": "patterns",
      "label": "Patterns",
      "blurb": "One page per pattern, in study order, each with its canonical problems in C# and Python.",
      "topics": [
        {
          "id": "dsa-arrays",
          "label": "Arrays, Strings & Windows",
          "href": "topics/dsa-arrays.html",
          "blurb": "In-place array and string work, converging and fast/slow pointers, fixed and variable sliding windows, prefix sums, intervals and matrix traversal.",
          "sections": [
            {
              "hash": "#arrays-strings",
              "label": "Arrays and strings"
            },
            {
              "hash": "#two-pointers",
              "label": "Two pointers"
            },
            {
              "hash": "#fast-slow",
              "label": "Fast and slow pointers"
            },
            {
              "hash": "#sliding-window",
              "label": "Sliding window"
            },
            {
              "hash": "#prefix-sums",
              "label": "Prefix sums and difference arrays"
            },
            {
              "hash": "#intervals",
              "label": "Intervals: merge, insert and overlap"
            },
            {
              "hash": "#matrix",
              "label": "Matrix traversal: spiral, rotate and in-place marking"
            }
          ]
        },
        {
          "id": "dsa-hashing",
          "label": "Hashing, Sets & Counting",
          "href": "topics/dsa-hashing.html",
          "blurb": "Frequency maps, HashSet membership, grouping by a derived key, prefix-sum plus map, custom keys and GetHashCode, bucketing for top-k, the LRU cache, and when hashing is the wrong answer.",
          "sections": [
            {
              "hash": "#frequency-map",
              "label": "Dictionary frequency map"
            },
            {
              "hash": "#sets",
              "label": "HashSet: membership, dedup and \"visited\""
            },
            {
              "hash": "#grouping",
              "label": "Grouping by a derived key"
            },
            {
              "hash": "#prefix-map",
              "label": "Prefix sums plus a map: subarray counting"
            },
            {
              "hash": "#custom-keys",
              "label": "Custom keys, GetHashCode and tuples"
            },
            {
              "hash": "#bucketing",
              "label": "Bucketing and top-k"
            },
            {
              "hash": "#lru",
              "label": "The LRU cache"
            },
            {
              "hash": "#when-not",
              "label": "When hashing is the wrong answer"
            }
          ]
        },
        {
          "id": "dsa-linear",
          "label": "Stacks, Queues & Lists",
          "href": "topics/dsa-linear.html",
          "blurb": "Stack matching and evaluation, the monotonic stack, deques and sliding-window maximum, linked-list surgery with dummy heads, min-stack, and iterators with yield return.",
          "sections": [
            {
              "hash": "#stack-queue",
              "label": "Stack and queue patterns"
            },
            {
              "hash": "#monotonic",
              "label": "The monotonic stack"
            },
            {
              "hash": "#deque",
              "label": "Deques and the sliding-window maximum"
            },
            {
              "hash": "#linked-list",
              "label": "Linked lists"
            },
            {
              "hash": "#list-surgery",
              "label": "Dummy heads, in-place partitioning and k-way merge"
            },
            {
              "hash": "#stack-designs",
              "label": "Min-stack, queue from stacks and other designs"
            },
            {
              "hash": "#iterators",
              "label": "Iterators and yield return"
            }
          ]
        },
        {
          "id": "dsa-search-sort",
          "label": "Binary Search & Sorting",
          "href": "topics/dsa-search-sort.html",
          "blurb": "The off-by-one-proof binary search template, lower and upper bound, binary search on the answer, rotated and 2-D search, comparers and stability, quicksort and mergesort from memory, counting sort and quickselect.",
          "sections": [
            {
              "hash": "#binary-search",
              "label": "Binary search"
            },
            {
              "hash": "#bounds",
              "label": "Lower bound, upper bound and Array.BinarySearch"
            },
            {
              "hash": "#search-answer",
              "label": "Binary search on the answer"
            },
            {
              "hash": "#rotated",
              "label": "Rotated arrays and 2-D search"
            },
            {
              "hash": "#sorting",
              "label": "Sorting and comparers"
            },
            {
              "hash": "#writing-sorts",
              "label": "Writing quicksort and mergesort from memory"
            },
            {
              "hash": "#linear-sorts",
              "label": "Counting sort, bucket sort and quickselect"
            }
          ]
        },
        {
          "id": "dsa-trees",
          "label": "Trees, Tries & Heaps",
          "href": "topics/dsa-trees.html",
          "blurb": "Traversals recursive and iterative, level-order BFS, BST operations, lowest common ancestor, serialise and deserialise, tries, heaps and PriorityQueue, top-k and merge-k, and the sorted collections .NET gives you.",
          "sections": [
            {
              "hash": "#traversals",
              "label": "Traversals: recursive and iterative"
            },
            {
              "hash": "#bfs-levels",
              "label": "Level-order BFS, depth and views"
            },
            {
              "hash": "#bst",
              "label": "BSTs: search, insert, validate and k-th smallest"
            },
            {
              "hash": "#lca-serialise",
              "label": "Lowest common ancestor and serialisation"
            },
            {
              "hash": "#tries",
              "label": "Tries: prefix search and word problems"
            },
            {
              "hash": "#heap",
              "label": "Heaps and PriorityQueue"
            },
            {
              "hash": "#heap-patterns",
              "label": "Top-k, merge-k and the two-heap median"
            },
            {
              "hash": "#sorted-collections",
              "label": "What .NET gives you: SortedSet, SortedDictionary and SortedList"
            }
          ]
        },
        {
          "id": "dsa-graphs",
          "label": "Graphs & Shortest Paths",
          "href": "topics/dsa-graphs.html",
          "blurb": "Representations, BFS and DFS, connected components, cycle detection and bipartite checking, topological sort, union-find, Dijkstra, Bellman-Ford and Floyd-Warshall, and minimum spanning trees.",
          "sections": [
            {
              "hash": "#representations",
              "label": "Representations: adjacency list, matrix and implicit graphs"
            },
            {
              "hash": "#graphs",
              "label": "BFS and DFS on graphs and grids"
            },
            {
              "hash": "#components",
              "label": "Connected components, flood fill and bipartite checking"
            },
            {
              "hash": "#topological",
              "label": "Topological sort: Kahn and DFS"
            },
            {
              "hash": "#union-find",
              "label": "Union-Find (disjoint set union)"
            },
            {
              "hash": "#dijkstra",
              "label": "Dijkstra and 0-1 BFS"
            },
            {
              "hash": "#other-shortest-paths",
              "label": "Bellman-Ford, Floyd-Warshall and MSTs"
            }
          ]
        },
        {
          "id": "dsa-recursion-dp",
          "label": "Recursion & Dynamic Programming",
          "href": "topics/dsa-recursion-dp.html",
          "blurb": "Brute force, memoise, tabulate — then the shapes that get asked: 1-D decisions, two-sequence grids, knapsack, LIS, intervals, bitmask and tree DP, and how to tell DP from greedy.",
          "sections": [
            {
              "hash": "#recursion-to-dp",
              "label": "From recursion to DP: the three-step conversion"
            },
            {
              "hash": "#one-dimension",
              "label": "One-dimensional DP: the decision at each index"
            },
            {
              "hash": "#two-strings",
              "label": "Two sequences: LCS, edit distance and the grid"
            },
            {
              "hash": "#knapsack",
              "label": "Knapsack: the one shape behind half of all DP questions"
            },
            {
              "hash": "#lis",
              "label": "Longest increasing subsequence, and the O(n log n) upgrade"
            },
            {
              "hash": "#grids",
              "label": "Grid DP: paths, costs and the obstacle cases"
            },
            {
              "hash": "#intervals",
              "label": "Interval and partition DP: when the split point is the decision"
            },
            {
              "hash": "#bitmask-trees",
              "label": "Bitmask DP and DP on trees"
            },
            {
              "hash": "#recognising",
              "label": "Recognising DP — and telling it from greedy"
            }
          ]
        },
        {
          "id": "dsa-backtracking",
          "label": "Backtracking",
          "href": "topics/dsa-backtracking.html",
          "blurb": "Choose, explore, un-choose. Subsets and permutations with duplicates, grid paths, N-Queens and Sudoku, the four prunes, and when a backtrack can be memoised into a DP.",
          "sections": [
            {
              "hash": "#the-template",
              "label": "The template: choose, explore, un-choose"
            },
            {
              "hash": "#combinations",
              "label": "Subsets and combinations, including duplicates"
            },
            {
              "hash": "#permutations",
              "label": "Permutations, with and without duplicates"
            },
            {
              "hash": "#grid-search",
              "label": "Backtracking on a grid: word search and path counting"
            },
            {
              "hash": "#constraints",
              "label": "Constraint puzzles: N-Queens and Sudoku"
            },
            {
              "hash": "#pruning",
              "label": "Pruning: the difference between hopeless and fast"
            },
            {
              "hash": "#memo-or-not",
              "label": "When to memoise a backtrack — and when you cannot"
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
