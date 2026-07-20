# The Complete 6-Month DSA Roadmap: Zero to Advanced

_A structured, pattern-first path from absolute beginner to confident LeetCode Medium/Hard solver and strong interview performer._

---

## Part 0: How This Roadmap Works

### The Philosophy

Most people fail at DSA for one of three reasons: they memorize solutions instead of learning patterns, they jump to hard topics before fundamentals are automatic, or they grind problems without ever reviewing mistakes. This roadmap is built to prevent all three.

**Core principles:**

1. **Patterns over problems.** ~20 patterns cover ~90% of interview questions. Every topic here is taught as a pattern with a recognition signal ("when you see X, think Y").
2. **Spaced repetition.** You will re-solve problems on a schedule (1 day → 3 days → 7 days → 21 days later). Solving a problem once teaches you almost nothing.
3. **Struggle before solution.** Always attempt for 30–45 minutes before looking at the answer. When you do look, close the solution and re-implement from memory.
4. **Checkpoints gate progress.** You do not move to the next topic until you pass its checkpoint. Speed is an illusion; retention is real progress.
5. **Progressive difficulty.** Easy → Medium within each topic, and Hard problems only once Mediums feel comfortable (usually Month 3+).

### Prerequisites

- One programming language (Python, Java, or C++). Python is fastest to learn; C++ is best for competitive programming; Java is common in interviews. Pick ONE and stick with it all 6 months.
- Comfort with: variables, loops, functions, if/else, basic I/O, classes (basic).
- A LeetCode account (free tier is enough for 90% of this roadmap).

### The Daily Schedule (4–6 hours/day)

| Block              | Duration   | Activity                                                                            |
| ------------------ | ---------- | ----------------------------------------------------------------------------------- |
| Block 1            | 45–60 min  | **Theory**: new concept via video/reading + hand-written notes                      |
| Block 2            | 30 min     | **Visualization & dry runs**: trace the algorithm on paper with small inputs        |
| Block 3            | 90–120 min | **New problems**: 2–4 problems on today's topic (timed: 25 min Easy, 40 min Medium) |
| Block 4            | 45 min     | **Spaced revision**: re-solve 2–3 problems from 1/3/7/21 days ago                   |
| Block 5            | 30 min     | **Mistake journal**: log every wrong approach, edge case missed, bug pattern        |
| Block 6 (optional) | 30–60 min  | **Contest/extra practice** (weekends: full LeetCode contest)                        |

**Weekly rhythm (every single week, all 6 months):**

- **Days 1–5:** New material + practice (schedule above)
- **Day 6:** _Contest + Mock day_ — 1 timed LeetCode Weekly/Biweekly contest (or virtual contest), then upsolve every problem you missed
- **Day 7:** _Revision day_ — no new material. Weak-topic review, mistake-journal analysis, re-solve the week's 5 hardest problems from scratch, flashcard review

### Tracking Metrics (log weekly in a spreadsheet)

- Problems solved (Easy/Medium/Hard split)
- First-attempt success rate (target: rising from ~30% → ~70%)
- Average time per Medium (target: falling from 60+ min → ~25 min)
- Contest rating (start doing rated contests from Month 2)
- Topics with <70% checkpoint scores (these get extra revision-day time)

---

## Part 1: The Month-by-Month Roadmap

### Learning Order & Why

```
Big O → Arrays/Strings → Hashing → Two Pointers → Sliding Window → Prefix Sum
  → Binary Search → Sorting → Recursion → Linked List → Stack/Queue
  → Trees → BST → Heaps → Tries → Backtracking
  → Graphs (BFS/DFS → Topo Sort → Union-Find → Shortest Paths → MST)
  → Greedy → Dynamic Programming → Bit Manipulation
  → Segment/Fenwick Trees → Advanced Graphs → Advanced DP
```

**Why this order:**

- **Big O first** because you cannot judge any solution without it.
- **Arrays/strings/hashing** are the substrate of everything — 40%+ of interview problems live here.
- **Two pointers / sliding window / prefix sum** are array _patterns_ — teach them immediately after arrays while the data structure is fresh.
- **Binary search before recursion** because it's the first "invariant thinking" algorithm and needs only arrays.
- **Recursion before linked lists/trees** because those structures are recursive by nature; recursion before backtracking because backtracking IS structured recursion.
- **Stacks/queues before trees/graphs** because tree BFS needs a queue, iterative DFS needs a stack.
- **Trees before graphs** because a tree is the simplest graph (connected, acyclic) — you learn traversal without worrying about cycles/visited sets.
- **Graphs before DP** — controversial, but graph problems build the "state + transition" mental model that makes DP click.
- **Greedy just before DP** because the key interview skill is telling them apart.
- **DP late** because it composes everything: recursion, memoization, arrays, sometimes graphs.
- **Segment trees / advanced topics last** — rare in interviews, common in CP; only worth it once fundamentals are elite.

---

# MONTH 1 — Foundations: Complexity, Arrays, Strings, Hashing, Core Array Patterns

**Goal:** Solve any LeetCode Easy in <20 min and begin Mediums. ~65–75 problems.
**Target level equivalent:** LeetCode contest rating ~1200–1350.

## Week 1: Big O + Arrays

### Topic: Big O / Complexity Analysis

- **Theory to learn:** What Big O measures (growth rate, not raw speed); O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!); best/average/worst case; amortized analysis (dynamic array resizing); space complexity including recursion stack; how to compute complexity of loops, nested loops, halving loops, and recursive calls (recursion tree method, intro to Master Theorem — full treatment in Month 2).
- **Common patterns:** Loop counting; "input halves each step → log n"; "for each element do O(n) work → n²"; dropping constants and lower-order terms.
- **Visualization:** Plot n vs. operations for each class; draw recursion trees for simple recursions.
- **Common mistakes:** Confusing O(n+m) with O(n·m); forgetting recursion stack space; thinking two sequential loops are O(n²); saying "hash map is O(1)" without noting worst case.
- **Interview tips:** ALWAYS state time and space complexity unprompted after coding. Interviewers specifically listen for this. Know constraints → complexity mapping: n ≤ 10⁶ → O(n) or O(n log n); n ≤ 10⁴ → O(n²) OK; n ≤ 20 → O(2ⁿ) OK; n ≤ 12 → O(n!) OK.
- **Revision strategy:** Flashcards for each complexity class + one example algorithm each. Re-derive complexities of the week's problems every revision day.

**Daily tasks, Days 1–2:**

- D1: Big O theory (Abdul Bari / NeetCode "Big O" videos), notes, analyze 10 code snippets by hand.
- D2: Amortized analysis + space complexity; solve complexity quizzes; start mistake journal.

### Topic: Arrays

- **Theory:** Memory layout (contiguous), indexing O(1), insertion/deletion O(n), dynamic arrays (append amortized O(1)), 2D arrays/matrices, in-place vs. extra-space operations, matrix traversal orders (row-major, diagonal, spiral, rotation by transpose+reverse).
- **Common patterns:** Traversal, in-place swap, reverse, rotation, matrix transpose, boundary simulation (spiral).
- **Visualization:** Draw index numbers under every array; for matrix problems, draw the grid and mark boundaries (top/bottom/left/right pointers).
- **Complexity:** Access O(1); search O(n); insert/delete middle O(n); append amortized O(1).
- **Common mistakes:** Off-by-one on boundaries; modifying an array while iterating it; forgetting empty-array edge case; confusing length vs. last index.
- **Interview tips:** Ask "can I modify the input?" and "is it sorted?" before coding. Sorted → immediately consider two pointers or binary search.
- **Revision:** Re-implement rotate array and spiral matrix from scratch weekly for 3 weeks.

**Daily tasks, Days 3–5:**

- D3 (Easy): Two Sum, Remove Duplicates from Sorted Array, Best Time to Buy and Sell Stock, Merge Sorted Array
- D4 (Easy→Med): Rotate Array, Move Zeroes, Plus One, Product of Array Except Self
- D5 (Med): Spiral Matrix, Rotate Image, Set Matrix Zeroes
- D6: Contest + upsolve. D7: Revision day (re-solve week's hardest 5).

**Week 1 total: ~12–14 problems.**

### ✅ CHECKPOINT 1 (end of Week 1) — must pass before Week 2

- State the complexity of any solution you wrote this week without looking.
- Solve Two Sum and Rotate Array from scratch in <15 min each.
- Explain amortized O(1) append in one paragraph.

## Week 2: Strings + Hashing

### Topic: Strings

- **Theory:** Immutability (Python/Java) and its complexity cost (string concatenation in a loop = O(n²) → use list/StringBuilder); ASCII vs Unicode; character frequency arrays (int[26]); palindrome checks; anagram logic; basic substring search. (KMP/Rabin-Karp deferred to Month 6 — pattern awareness only for now.)
- **Common patterns:** Frequency counting, reverse, two-pointer palindrome, sliding comparisons, string building.
- **Visualization:** Write characters with indices; for palindromes draw converging arrows from both ends.
- **Complexity:** Concatenation in loop O(n²) naive; charAt O(1); substring O(k).
- **Common mistakes:** += concatenation in loops; forgetting case sensitivity; not handling empty string; assuming lowercase-only without asking.
- **Interview tips:** Ask about character set (lowercase only? Unicode?) and whether spaces/punctuation count. Frequency array int[26] beats hash map when alphabet is fixed.
- **Revision:** Group Anagrams and Valid Palindrome re-solved at day 3 and day 7.

### Topic: Hashing (Hash Map / Hash Set)

- **Theory:** Hash function, buckets, collisions (chaining vs open addressing), load factor and resizing, why average O(1) / worst O(n), what makes a good hash key, hashing tuples/strings, ordered vs unordered maps, when a set suffices instead of a map.
- **Common patterns:** Frequency map; complement lookup (Two Sum pattern); seen-set for duplicates; grouping by canonical key (sorted string / char-count tuple for anagrams); index maps.
- **Visualization:** Draw buckets and show a collision resolved by chaining.
- **Complexity:** Insert/lookup/delete average O(1), worst O(n); space O(n).
- **Common mistakes:** Using mutable objects as keys; iterating a map while modifying it; forgetting that map lookups of missing keys can throw/return default; using O(n) `in list` when a set was needed.
- **Interview tips:** "Can I trade space for time?" is the #1 optimization question — the answer is usually a hash map. If your brute force is O(n²) with a "find matching element" inner loop, a hash map almost always makes it O(n).
- **Revision:** Flashcard: "O(n²) pair search → hash map complement" pattern.

**Daily tasks:**

- D1: String theory + Valid Anagram, Valid Palindrome, Longest Common Prefix
- D2: Hashing theory + Contains Duplicate, Two Sum (re-solve with map), Intersection of Two Arrays
- D3: Group Anagrams, Top K Frequent Elements (map+sort version), Ransom Note
- D4: Longest Consecutive Sequence, Encode and Decode Strings, Valid Sudoku
- D5: First Unique Character, Subarray Sum Equals K (preview of prefix sum + hashing), Isomorphic Strings
- D6: Contest + upsolve. D7: Revision.

**Week 2 total: ~15 problems.**

### ✅ CHECKPOINT 2

- Solve Group Anagrams and Longest Consecutive Sequence from scratch, both O(n)/O(n·k), in <25 min each.
- Explain how a hash map achieves average O(1) and when it degrades.

## Week 3: Two Pointers + Sliding Window

### Topic: Two Pointers

- **Theory:** Converging pointers (both ends inward — sorted arrays, palindromes), parallel pointers (slow/fast writer — in-place removal), pointers on two arrays (merge). Why sortedness enables the converging pattern (monotonic movement = each pointer moves one direction only = O(n)).
- **Common patterns:** Pair-sum in sorted array; in-place partition/removal (read/write pointers); container/trapping problems (move the limiting side); merging.
- **Visualization:** Draw L and R arrows; at each step write down WHY you moved the pointer you moved. This "why" is the whole pattern.
- **Complexity:** O(n) time, O(1) space — this is its selling point over hashing.
- **Common mistakes:** Moving the wrong pointer in container problems; infinite loops from not advancing; using two pointers on unsorted data where it's invalid; off-by-one in while conditions (`<` vs `<=`).
- **Interview tips:** Recognition signal: _sorted array + pair/triplet condition_ or _in-place with O(1) space required_. For 3Sum: sort, fix one element, two-pointer the rest — and know the duplicate-skipping logic cold.
- **Revision:** Re-derive the 3Sum duplicate-skip logic on paper twice this month.

### Topic: Sliding Window

- **Theory:** Fixed-size window (slide by add-right/remove-left) vs variable-size window (expand right while valid / shrink left while invalid). The invariant: the window always satisfies (or is being repaired to satisfy) a condition. Why it's O(n): each element enters and leaves the window at most once.
- **Common patterns:** Longest substring/subarray with condition (expand-shrink); minimum window containing requirement (shrink-when-satisfied); fixed-k aggregate (max sum of size k); frequency-map-inside-window (anagram detection).
- **Visualization:** Draw the array, bracket the window, and log a table of (left, right, window state, best answer) at each step. Do this by hand for at least 3 problems — it's the single best way to internalize the pattern.
- **Complexity:** O(n) time (each pointer moves forward only), space O(1) or O(k) for a window map.
- **Common mistakes:** Shrinking with `if` instead of `while`; updating the answer at the wrong moment (before vs after repair); forgetting to remove the leftmost element's contribution; mixing up "longest valid" vs "shortest satisfying" templates.
- **Interview tips:** Recognition signal: _contiguous subarray/substring + optimize (longest/shortest/max/min) + condition_. Memorize both templates (longest-valid and shortest-satisfying) as skeletons, not solutions.
- **Revision:** Flashcards with both templates; re-solve Longest Substring Without Repeating Characters at days 1/3/7/21.

**Daily tasks:**

- D1: Two pointers theory + Valid Palindrome II, Two Sum II, Remove Element
- D2: 3Sum, Container With Most Water
- D3: Trapping Rain Water (attempt, study, re-implement), Sort Colors
- D4: Sliding window theory + Maximum Average Subarray I, Longest Substring Without Repeating Characters
- D5: Permutation in String, Longest Repeating Character Replacement
- D6: Contest + Minimum Window Substring (hard — attempt with hints). D7: Revision.

**Week 3 total: ~12 problems.**

### ✅ CHECKPOINT 3

- Solve 3Sum with correct duplicate handling in <35 min.
- Write both sliding-window templates from memory.
- Explain in one sentence why sliding window is O(n) and not O(n²).

## Week 4: Prefix Sum + Month 1 Consolidation

### Topic: Prefix Sum

- **Theory:** prefix[i] = sum of first i elements; range sum (l, r) = prefix[r+1] − prefix[l]; prefix sum + hash map for "count subarrays with sum k" (the key identity: prefix[j] − prefix[i] = k ⟺ prefix[i] = prefix[j] − k); 2D prefix sums; prefix XOR/product variants; difference arrays for range updates.
- **Common patterns:** Range-sum queries; subarray-sum-equals-k counting; equilibrium/pivot index; products except self (prefix × suffix).
- **Visualization:** Draw the array and its prefix array aligned; shade the range and show the subtraction.
- **Complexity:** O(n) preprocessing, O(1) per query; O(n) space.
- **Common mistakes:** Off-by-one in prefix indexing (use length n+1 with prefix[0]=0 to avoid); forgetting to seed the hash map with {0:1} in subarray-count problems; overflow in other languages.
- **Interview tips:** Recognition signal: _many range-sum queries_ or _count subarrays with exact sum/condition_. The prefix+hashmap combo is a top-10 interview pattern.
- **Revision:** Re-derive the prefix[i] = prefix[j] − k identity from scratch on revision day.

**Daily tasks:**

- D1: Prefix theory + Range Sum Query - Immutable, Find Pivot Index
- D2: Subarray Sum Equals K (proper solve now), Contiguous Array
- D3: Range Sum Query 2D - Immutable, Product of Array Except Self (re-solve as prefix/suffix)
- D4–5: **Month 1 mixed review set** (solve without topic labels — pattern recognition training): Merge Intervals (preview), Majority Element, Squares of a Sorted Array, Longest Palindromic Substring (attempt), Insert Delete GetRandom O(1)
- D6: Contest + mock interview problem set (3 problems, 60 min, talk aloud, record yourself).
- D7: **Monthly evaluation** (below).

**Week 4 total: ~12 problems. Month 1 total: ~55–65 problems (≈35 Easy, ≈25 Medium).**

## 🏁 MONTH 1 MILESTONE

- **Milestone project:** Build a small library implementing dynamic array, hash map (chaining), and a sliding-window rate limiter from scratch in your language, with tests. This forces internalization of the internals.
- **Mock interview:** 2 problems (1 Easy, 1 Medium from arrays/hashing/window), 45 min, spoken aloud with a friend or recorded (use Pramp/interviewing.io free peer mocks).
- **Progress evaluation / metrics:** First-attempt success ≥50% on Easy, ≥25% on Medium; avg Easy time ≤20 min.
- **Target rating equivalent:** ~1300 LeetCode contest rating.
- **Success checklist:** □ 55+ problems □ Both window templates memorized □ Prefix+hashmap identity derivable □ Checkpoints 1–3 passed □ Mistake journal has ≥20 entries with lessons

---

# MONTH 2 — Binary Search, Sorting, Recursion, Linked Lists, Stacks & Queues

**Goal:** Comfortable with Mediums across these topics; recursion becomes natural. ~60 problems.
**Target rating equivalent:** ~1400–1500.

## Week 5: Binary Search + Sorting

### Topic: Binary Search

- **Theory:** Classic search on sorted array; the invariant mindset (the answer always lies in [lo, hi]); overflow-safe mid; lower_bound / upper_bound (first ≥ target, first > target); search on rotated arrays; **binary search on the answer space** (minimize the maximum / maximize the minimum, with a monotonic feasibility check).
- **Common patterns:** Exact search; boundary search (first/last occurrence); rotated array pivot logic; search-on-answer (Koko Eating Bananas archetype: guess a value, check feasibility in O(n), binary search the guess).
- **Visualization:** Draw lo/hi/mid at every iteration; for search-on-answer, draw the answer axis as FFFFFTTTTT and mark that you're finding the first T.
- **Complexity:** O(log n) per search; search-on-answer is O(n log(range)).
- **Common mistakes:** Infinite loops (lo = mid instead of mid+1); wrong loop condition (`<` vs `<=` — pick ONE template and never deviate); applying binary search to non-monotonic conditions; off-by-one in boundary variants.
- **Interview tips:** Recognition signals: _sorted_, _O(log n) required_, _"minimum/maximum value such that..."_. Standardize on one template: `while lo < hi: mid = (lo+hi)//2; if feasible(mid): hi = mid else lo = mid+1` — it solves 90% of variants.
- **Revision:** Write your template from memory every revision day for 3 weeks. It must become reflexive.

### Topic: Sorting Algorithms

- **Theory:** Bubble/selection/insertion (know mechanics + why O(n²)); merge sort (divide & conquer, stable, O(n log n), O(n) space — implement it); quicksort (partitioning, average O(n log n), worst O(n²), quickselect for k-th element — implement both); heapsort concept; counting/bucket/radix (non-comparison, when applicable); stability and why it matters; Master Theorem for divide-and-conquer recurrences (now formally).
- **Common patterns:** Sort-then-process (intervals, two pointers); custom comparators; quickselect for top-k; counting sort when value range is small.
- **Visualization:** VisuAlgo sorting animations; hand-trace merge sort's recursion tree on an 8-element array.
- **Complexity:** Comparison sorts lower bound O(n log n); counting sort O(n+k).
- **Common mistakes:** Unstable sort when order matters; writing merge with wrong boundary conditions; quicksort worst case on sorted input without randomization.
- **Interview tips:** You rarely implement sorts in interviews, but you MUST know quickselect (Kth Largest Element) and merge (merge two sorted lists/arrays) cold. "Sort first?" should be an early question on every array problem.
- **Revision:** Re-implement merge sort and quickselect from memory once in Month 2 and once in Month 4.

**Daily tasks:**

- D1: BS theory + Binary Search, First Bad Version, Search Insert Position
- D2: Find First and Last Position of Element, Search in Rotated Sorted Array
- D3: Find Minimum in Rotated Sorted Array, Koko Eating Bananas
- D4: Capacity To Ship Packages Within D Days, Split Array Largest Sum (hard, attempt with hints)
- D5: Implement merge sort + quicksort from scratch; Kth Largest Element in an Array (quickselect); Sort an Array
- D6: Contest + Median of Two Sorted Arrays (hard — study, don't grind). D7: Revision.

**Week 5 total: ~13 problems.**

### ✅ CHECKPOINT 4

- Write your binary search template from memory, bug-free, first try.
- Solve Koko Eating Bananas in <30 min explaining the monotonic feasibility argument.
- Implement merge sort from memory.

## Week 6: Recursion (deep) + Intro Backtracking

### Topic: Recursion

- **Theory:** Base case + recursive case; the "leap of faith" (trust the subproblem); call stack mechanics and stack overflow; recursion tree drawing; converting recursion↔iteration; tail recursion; complexity via recursion trees (branches^depth); divide & conquer as a recursion style.
- **Common patterns:** Linear recursion (factorial, reverse), tree-shaped recursion (fib, subsets), divide & conquer (merge sort, pow(x,n)), helper-function-with-accumulator.
- **Visualization:** For EVERY recursive problem in the next 2 weeks, draw the recursion tree for a tiny input. Non-negotiable — this is how recursion becomes intuitive.
- **Complexity:** Time ≈ number of nodes in recursion tree × work per node; space ≈ max depth.
- **Common mistakes:** Missing/wrong base case; mutating shared state without undoing it; recomputing overlapping subproblems (this pain sets up DP later — feel it now on naive fib); ignoring stack depth limits.
- **Interview tips:** Verbalize the recurrence in English before coding: "f(n) is defined as ... in terms of f(smaller)." If you can say it, you can code it.
- **Revision:** Recursion-tree flashcards: given code, sketch the tree and state complexity.

**Daily tasks:**

- D1: Theory + Pow(x, n), Fibonacci (naive, then memoized — feel the difference), Reverse String recursively
- D2: Climbing Stairs (recursive→memo), Merge Two Sorted Lists (recursive), Subsets (first taste of choose/not-choose)
- D3: Permutations, Letter Combinations of a Phone Number
- D4: Generate Parentheses, Combination Sum (intro to backtracking template — full treatment Month 3)
- D5: K-th Symbol in Grammar, Tower of Hanoi (implement), Swap Nodes in Pairs (recursive)
- D6: Contest. D7: Revision.

**Week 6 total: ~13 problems.**

### ✅ CHECKPOINT 5

- Draw the recursion tree for Subsets on [1,2,3] and state the 2ⁿ complexity.
- Solve Generate Parentheses from scratch in <30 min.

## Week 7: Linked Lists

### Topic: Linked List

- **Theory:** Node structure, singly vs doubly; head/tail operations O(1), search O(n); dummy (sentinel) node technique; **fast & slow pointers** (middle, cycle detection — Floyd's algorithm and WHY it works); reversal (iterative 3-pointer and recursive); merging; reordering.
- **Common patterns:** Fast & slow pointer (middle, cycle, cycle start); in-place reversal (whole list, sublist, k-groups); dummy head for edge-free insertion/deletion; two-list merge.
- **Visualization:** Draw boxes and arrows for EVERY problem. Physically redraw pointers at each step of a reversal until you can do it eyes-closed. Most linked-list bugs are drawing failures, not logic failures.
- **Complexity:** Access O(n), insert/delete at known node O(1); all patterns O(n) time, O(1) space.
- **Common mistakes:** Losing the rest of the list by overwriting .next too early; null-pointer errors at head/tail; forgetting the dummy node; not handling 0/1-node lists; breaking cycles incorrectly.
- **Interview tips:** Say "I'll use a dummy node to avoid head edge cases" — it signals experience. Floyd's cycle detection and list reversal are asked constantly; know the cycle-start proof (meeting point math).
- **Revision:** Reverse Linked List re-solved at days 1/3/7/21. It's the "hello world" interviewers use to warm up — you must do it flawlessly in <5 min.

**Daily tasks:**

- D1: Theory + Reverse Linked List, Middle of the Linked List, Design Linked List
- D2: Linked List Cycle, Linked List Cycle II (understand the proof), Merge Two Sorted Lists (iterative)
- D3: Remove Nth Node From End of List, Palindrome Linked List, Delete Node in a Linked List
- D4: Reorder List, Add Two Numbers
- D5: Copy List with Random Pointer, Reverse Linked List II
- D6: Contest + Merge k Sorted Lists (attempt; revisit after heaps). D7: Revision.

**Week 7 total: ~14 problems.**

### ✅ CHECKPOINT 6

- Reverse a linked list (iterative AND recursive) from memory in <10 min total.
- Explain why Floyd's tortoise-and-hare finds the cycle start.

## Week 8: Stacks & Queues + Monotonic Stack

### Topic: Stack

- **Theory:** LIFO; array/list-backed implementation; call-stack connection; matching/nesting problems; expression evaluation; **monotonic stack** (maintain increasing/decreasing stack; pop while violated; each element pushed/popped once → O(n)); min-stack design.
- **Common patterns:** Balanced parentheses/matching; nearest greater/smaller element (monotonic); histogram problems; stack-based simulation (asteroid collisions, string decoding); two-stack designs.
- **Visualization:** Draw the stack vertically and log its contents after every push/pop in a table. For monotonic stack problems this table IS the solution.
- **Complexity:** Push/pop/peek O(1); monotonic stack passes O(n) total.
- **Common mistakes:** Popping from an empty stack; wrong monotonic direction (increasing vs decreasing — derive it from "what am I waiting for?"); forgetting to flush the stack at the end.
- **Interview tips:** Recognition signal: _"next/previous greater/smaller element"_, _nested structure_, _"most recent unmatched thing"_. Largest Rectangle in Histogram is a rite of passage — invest real time in it.
- **Revision:** Daily Temperatures re-solve at 1/3/7; re-derive "which direction is my monotonic stack" logic on revision days.

### Topic: Queue & Deque

- **Theory:** FIFO; circular buffer implementation; deque operations; queue via two stacks (amortized analysis!); **monotonic deque** for sliding window maximum; BFS foreshadowing.
- **Common patterns:** BFS frontier (next week's star); sliding window max via monotonic deque; design problems.
- **Complexity:** Enqueue/dequeue O(1); deque both ends O(1).
- **Common mistakes:** Using a list with O(n) pop-front instead of a real deque; circular buffer index arithmetic.
- **Interview tips:** Implement Queue using Stacks is a classic — know the amortized argument.

**Daily tasks:**

- D1: Valid Parentheses, Min Stack, Implement Queue using Stacks, Implement Stack using Queues
- D2: Evaluate Reverse Polish Notation, Daily Temperatures (monotonic intro)
- D3: Next Greater Element I & II, Asteroid Collision
- D4: Car Fleet, Largest Rectangle in Histogram (attempt → study → re-implement)
- D5: Sliding Window Maximum (monotonic deque), Decode String
- D6: Contest + mock (2 problems, 45 min). D7: **Monthly evaluation.**

**Week 8 total: ~14 problems. Month 2 total: ~55 problems.**

## 🏁 MONTH 2 MILESTONE

- **Milestone project:** Build a mini expression calculator (supports + − × ÷ and parentheses) using stacks, plus an LRU-style browser-history simulator using a doubly linked list.
- **Mock interview:** Full 45-min mock: 1 linked list + 1 monotonic stack Medium, spoken aloud.
- **Metrics:** Medium first-attempt success ≥40%; avg Medium ≤40 min; started rated contests (do every weekly contest from now on).
- **Target rating:** ~1450–1500.
- **Success checklist:** □ BS template reflexive □ Reversal & Floyd's flawless □ Monotonic stack direction derivable □ Checkpoints 4–6 passed □ ~120 cumulative problems

---

# MONTH 3 — Trees, BSTs, Heaps, Tries, Backtracking

**Goal:** Non-linear thinking; recursion mastery on real structures. ~60 problems, first real Hards.
**Target rating:** ~1550–1650.

## Week 9: Binary Trees

### Topic: Trees / Binary Trees

- **Theory:** Terminology (root, leaf, depth, height, balanced, complete, perfect); recursive definition (a tree is a node + two subtrees — this is why recursion week came first); traversals: preorder/inorder/postorder (recursive + iterative with stack), level-order (queue/BFS); **the universal tree-recursion template**: "get answers from left and right subtrees, combine, return"; passing info DOWN (parameters) vs UP (return values) vs AROUND (global/nonlocal).
- **Common patterns (Tree DFS):** Height/depth; diameter (combine child answers, update global); path sums (root-to-leaf accumulate down); validate properties (pass constraints down); LCA (return signal up); tree comparison/symmetry (parallel recursion). **(Tree BFS):** level order, level aggregates (avg/max), right-side view, zigzag.
- **Visualization:** Draw every tree; annotate each node with what your function RETURNS at that node and what it UPDATES globally. This return/update annotation dissolves 90% of tree confusion.
- **Complexity:** Traversal O(n) time; space O(h) recursion (O(log n) balanced, O(n) skewed); BFS space O(width).
- **Common mistakes:** Confusing depth with height; forgetting null checks; mixing up "return value" vs "global answer" (diameter!); mutating during traversal; assuming balanced.
- **Interview tips:** Recognition: any tree problem → first ask "can I solve this by combining left/right subtree answers?" (DFS) or "is this about levels?" (BFS). State recursion space complexity — interviewers check.
- **Revision:** Iterative inorder with explicit stack re-implemented weekly ×3; diameter re-solved 1/3/7/21.

**Daily tasks:**

- D1: Theory + Maximum Depth of Binary Tree, Invert Binary Tree, Same Tree
- D2: Symmetric Tree, Path Sum, Diameter of Binary Tree
- D3: Binary Tree Level Order Traversal, Binary Tree Right Side View, Balanced Binary Tree
- D4: Binary Tree Zigzag Level Order Traversal, Lowest Common Ancestor of a Binary Tree, Count Good Nodes in Binary Tree
- D5: Binary Tree Maximum Path Sum (hard — the diameter pattern's boss fight), Construct Binary Tree from Preorder and Inorder Traversal
- D6: Contest + Serialize and Deserialize Binary Tree (hard). D7: Revision.

**Week 9 total: ~15 problems.**

### ✅ CHECKPOINT 7

- Solve Diameter and LCA from scratch, correctly separating return-value from global-answer.
- Write all three DFS traversals recursively + inorder iteratively from memory.

## Week 10: BSTs + Heaps

### Topic: Binary Search Trees

- **Theory:** BST invariant (left < node < right — for the ENTIRE subtree, not just children); **inorder traversal = sorted order** (the key fact); search/insert/delete O(h); delete's three cases (leaf, one child, two children → inorder successor); validation via (min, max) bounds passed down; why balance matters (AVL/Red-Black conceptually only — never implemented in interviews).
- **Common patterns:** Validate with bounds; k-th smallest via inorder; LCA using BST ordering (no recursion needed!); floor/ceil; sorted array → balanced BST; two-sum in BST.
- **Visualization:** Draw the valid range [min, max] beside each node when validating — makes the classic "only checked children" bug impossible.
- **Complexity:** O(h) ops: O(log n) balanced, O(n) skewed. Always state both.
- **Common mistakes:** Validating only parent-child pairs instead of subtree ranges; forgetting duplicates policy; assuming balanced.
- **Interview tips:** The moment you see "BST," think _inorder = sorted_ and _compare-to-root navigation_. LCA in BST should take you 3 minutes.
- **Revision:** Validate BST re-solve 1/3/7.

### Topic: Heap / Priority Queue

- **Theory:** Complete binary tree in an array (children 2i+1, 2i+2); heap property; sift-up/sift-down; build-heap in O(n) (and why); min-heap vs max-heap (and the negate trick); language built-ins (heapq / PriorityQueue); heapsort concept.
- **Common patterns (Top-K):** K largest/smallest → heap of size k (min-heap for k-largest!); k-th element (heap or quickselect — compare!); merge k sorted lists; **two-heaps** for running median (max-heap of lows + min-heap of highs); scheduling/simulation by priority; k closest points.
- **Visualization:** Draw the array AND the tree side by side; trace a sift-down.
- **Complexity:** Push/pop O(log n); peek O(1); build O(n); top-k of n items O(n log k).
- **Common mistakes:** Max-heap vs min-heap confusion for top-k (use a MIN-heap of size k to keep the k LARGEST); comparing custom objects without keys; using a heap when sorting once is simpler.
- **Interview tips:** Recognition: _"k-th"_, _"k largest/closest/most frequent"_, _"running/streaming"_, _"merge k"_. For k-th largest, discuss heap O(n log k) vs quickselect O(n) average — offering both is a strong signal.
- **Revision:** Two-heaps median technique flashcard; re-solve Kth Largest 1/3/7.

**Daily tasks:**

- D1: BST theory + Search in a BST, Insert into a BST, Validate Binary Search Tree
- D2: Kth Smallest Element in a BST, LCA of a BST, Convert Sorted Array to BST
- D3: Delete Node in a BST, Two Sum IV, Inorder Successor in BST (or Trim a BST)
- D4: Heap theory + Kth Largest Element in a Stream, Last Stone Weight, K Closest Points to Origin
- D5: Top K Frequent Elements (heap version), Task Scheduler, Merge k Sorted Lists (now with heap — full solve)
- D6: Contest + Find Median from Data Stream (hard, two heaps). D7: Revision.

**Week 10 total: ~15 problems.**

### ✅ CHECKPOINT 8

- Validate BST with bounds, first try, no bugs.
- Explain min-heap-of-size-k for top-k and its O(n log k) complexity.
- Solve Find Median from Data Stream having internalized (not memorized) two-heaps.

## Week 11: Tries + Backtracking

### Topic: Trie (Prefix Tree)

- **Theory:** Node = children map/array(26) + isEnd flag; insert/search/startsWith O(L); space trade-offs; when trie beats hash set (prefix queries, autocomplete, wildcard matching); trie + DFS combos.
- **Common patterns:** Prefix search/autocomplete; wildcard search (DFS branching on '.'); word-break style lookups; grid word search acceleration (Word Search II).
- **Visualization:** Draw the trie for {"cat","car","card"} — shared prefixes become obvious.
- **Complexity:** All ops O(L) where L = word length; space O(total characters).
- **Common mistakes:** Forgetting isEnd (matching prefixes as words); not handling empty string; memory blow-up with array-children when alphabet is huge.
- **Interview tips:** Recognition: _"prefix"_, _"autocomplete"_, _"dictionary of words + repeated lookups"_. Implement Trie is a top-50 interview question — know it cold.

### Topic: Backtracking

- **Theory:** The universal template: `choose → explore → un-choose`; state space trees; pruning (constraint checks before recursing); the three archetypes — **subsets** (include/exclude), **permutations** (used-set / swapping), **combinations** (start index); handling duplicates (sort + skip same-level repeats); complexity as O(branches^depth × copy-cost).
- **Common patterns:** Subsets/combinations/permutations (+ duplicate variants); constraint satisfaction (N-Queens, Sudoku); path finding in grids (Word Search); partitioning (Palindrome Partitioning); target-sum building (Combination Sum I/II).
- **Visualization:** Draw the decision tree for Subsets([1,2,3]) and Permutations([1,2,3]) fully, once, by hand. Label each edge with the choice. This single exercise makes all backtracking legible.
- **Complexity:** Subsets O(2ⁿ·n); permutations O(n!·n); always mention the copy cost.
- **Common mistakes:** Forgetting to undo (pop/unmark) after recursing; appending a reference instead of a copy of the path; wrong duplicate-skipping condition (`i > start and nums[i]==nums[i-1]`); missing pruning → TLE.
- **Interview tips:** Recognition: _"all possible..."_, _"generate every..."_, _"count ways with constraints"_ (small n!). Constraints n ≤ 20 scream backtracking. Narrate choose/explore/unchoose as you code.
- **Revision:** Write the three archetype templates from memory weekly through Month 4.

**Daily tasks:**

- D1: Trie theory + Implement Trie (Prefix Tree), Design Add and Search Words Data Structure
- D2: Longest Word in Dictionary, Replace Words; review backtracking template
- D3: Subsets, Subsets II, Permutations
- D4: Combination Sum, Combination Sum II, Combinations
- D5: Word Search, Palindrome Partitioning
- D6: Contest + N-Queens (hard) and Word Search II (hard, trie+backtracking). D7: Revision.

**Week 11 total: ~15 problems.**

### ✅ CHECKPOINT 9

- Write subsets/permutations/combinations templates from memory.
- Solve Combination Sum II with correct duplicate handling, <35 min.
- Explain N-Queens pruning (cols, diagonals as sets).

## Week 12: Consolidation + First Interview Simulation Block

**Daily tasks:**

- D1–3: Mixed unlabeled set (pattern recognition under uncertainty): Kth Smallest in BST (re-solve), Binary Tree Level Order II, Sum Root to Leaf Numbers, Flatten Binary Tree to Linked List, House Robber III (preview of tree DP!), Letter Case Permutation, Restore IP Addresses, Design Twitter (heap + hashmap design)
- D4: Full 60-min mock: 1 tree Medium + 1 backtracking Medium, talked aloud.
- D5: Weak-topic surgery — your metrics sheet tells you which topic is <70%; spend the whole day there.
- D6: Contest + upsolve. D7: **Monthly evaluation.**

**Week 12 total: ~12 problems. Month 3 total: ~57 problems (cumulative ≈ 175–185).**

## 🏁 MONTH 3 MILESTONE

- **Milestone project:** Build an autocomplete engine: trie-backed, returns top-k completions by frequency (trie + heap + hashmap — three topics composed).
- **Mock interview:** Full FAANG-format 45-min mock with a peer (Pramp/interviewing.io): intro + 1 Medium + complexity discussion + questions.
- **Metrics:** Medium first-attempt ≥50%; avg Medium ≤35 min; ≥3 Hards solved (with hints OK).
- **Target rating:** ~1600.
- **Success checklist:** □ Tree return-vs-global distinction automatic □ Backtracking templates from memory □ Two-heaps + top-k patterns internalized □ Checkpoints 7–9 passed □ ~180 cumulative problems

---

# MONTH 4 — Graphs: The Full Arsenal

**Goal:** Every graph pattern recognized and executed. ~55 problems.
**Target rating:** ~1650–1750.

## Week 13: Graph Representation + BFS/DFS

### Topic: Graphs, DFS, BFS

- **Theory:** Terminology (directed/undirected, weighted, cycles, connected components, degree); representations — adjacency list (default), adjacency matrix (dense/small), edge list (for Union-Find/Kruskal); building adjacency lists from edge lists; grids AS graphs (cells = nodes, 4-directional moves = edges); **DFS** (recursive + iterative, visited set, component counting, cycle detection in undirected via parent tracking); **BFS** (queue, level-by-level processing, why BFS gives shortest path in unweighted graphs); **multi-source BFS** (seed the queue with all sources — Rotting Oranges); visited-before-enqueue vs after (correctness + efficiency).
- **Common patterns (Graph Traversal):** Connected components / island counting; flood fill; shortest unweighted path (BFS); multi-source spread; boundary DFS (Pacific Atlantic); clone via traversal + map; cycle detection; bipartite check (2-coloring with BFS/DFS).
- **Visualization:** For grid problems, print/draw the grid and mark visited cells. For BFS, write out the queue contents level by level. Draw small graphs for every non-grid problem — always.
- **Complexity:** DFS/BFS O(V + E) time, O(V) space. Grid: O(rows × cols).
- **Common mistakes:** Forgetting the visited set (infinite loops); marking visited at dequeue instead of enqueue (duplicates in queue); not handling disconnected graphs (loop over all nodes); modifying the grid without noting it to the interviewer; recursion depth overflow on huge grids (know the iterative fallback).
- **Interview tips:** Recognition: _grid + regions/spread_, _"connected"_, _"shortest number of steps"_ (→ BFS, never DFS), _relationships/prerequisites_ (→ graph even if not stated as one). Say your V+E complexity in terms of the problem (rows·cols).
- **Revision:** Number of Islands re-solved 1/3/7/21 in BOTH DFS and BFS forms.

**Daily tasks:**

- D1: Theory + build adjacency list utility; Find if Path Exists in Graph, Number of Islands
- D2: Max Area of Island, Flood Fill, Number of Connected Components in an Undirected Graph
- D3: Clone Graph, Rotting Oranges (multi-source BFS)
- D4: Pacific Atlantic Water Flow, Surrounded Regions
- D5: Is Graph Bipartite?, Shortest Path in Binary Matrix, 01 Matrix
- D6: Contest + Walls and Gates (or Shortest Bridge). D7: Revision.

**Week 13 total: ~14 problems.**

### ✅ CHECKPOINT 10

- Solve Number of Islands both ways, <15 min each.
- Explain why BFS (not DFS) finds shortest paths in unweighted graphs.
- Explain visited-at-enqueue vs visited-at-dequeue.

## Week 14: Topological Sort + Union-Find

### Topic: Topological Sort

- **Theory:** DAGs; topological order definition; **Kahn's algorithm** (in-degree counting + BFS) — the interview default; DFS post-order reversal alternative; cycle detection in directed graphs (Kahn's: processed count < n; DFS: gray/white/black states); why topo sort ⟺ dependency resolution.
- **Common patterns:** Course scheduling / prerequisites; build orders; alien dictionary (derive edges from data, then topo sort); layered peeling (safe states).
- **Visualization:** Draw the DAG, write in-degrees beside each node, and simulate Kahn's queue by hand once.
- **Complexity:** O(V + E).
- **Common mistakes:** Using undirected cycle detection on directed graphs; forgetting nodes with zero edges; not detecting cycles (impossible orderings).
- **Interview tips:** Recognition: _"prerequisites"_, _"dependencies"_, _"order of tasks"_, _"comes before"_. Course Schedule I/II are among the most-asked graph questions at FAANG.

### Topic: Union-Find (Disjoint Set Union)

- **Theory:** parent array; find with **path compression**; union by rank/size; near-O(1) amortized (inverse Ackermann — just name it); component counting via decrementing; cycle detection in undirected graphs (union returns false ⇒ cycle); when DSU beats DFS (dynamic/incremental edges, Kruskal's).
- **Common patterns:** Dynamic connectivity; redundant connection (first cycle edge); accounts/groups merging; counting provinces; Kruskal's MST (next week).
- **Visualization:** Draw parent-pointer forests before/after path compression.
- **Complexity:** Amortized ~O(α(n)) per op with both optimizations.
- **Common mistakes:** Forgetting path compression (→ O(n) chains); unioning roots' children instead of roots; not using find() before comparing.
- **Interview tips:** Memorize the ~10-line implementation cold — you'll write it dozens of times. Recognition: _"groups that merge"_, _"connected as edges arrive"_.
- **Revision:** Write DSU from memory weekly through Month 6.

**Daily tasks:**

- D1: Topo theory + Course Schedule, Course Schedule II
- D2: Find Eventual Safe States, Minimum Height Trees (advanced peeling)
- D3: Alien Dictionary (hard — the topo boss fight)
- D4: DSU theory + implement DSU; Number of Provinces (DSU version), Redundant Connection
- D5: Accounts Merge, Graph Valid Tree, Satisfiability of Equality Equations
- D6: Contest + upsolve. D7: Revision.

**Week 14 total: ~11 problems.**

### ✅ CHECKPOINT 11

- Implement Kahn's algorithm and DSU (compression + rank) from memory.
- Solve Course Schedule II in <25 min.

## Week 15: Shortest Paths + MST

### Topic: Shortest Path Algorithms

- **Theory:** **Dijkstra** (min-heap of (dist, node); lazy deletion; non-negative weights only — know WHY it fails on negatives); **Bellman-Ford** (V−1 relaxation rounds; handles negatives; detects negative cycles; the "at most k edges" variant); **Floyd-Warshall** (all-pairs DP, O(V³), tiny graphs); **0-1 BFS** (deque trick, weights ∈ {0,1}); BFS as shortest-path when unweighted. Choosing: unweighted→BFS; non-negative→Dijkstra; negative edges or ≤k stops→Bellman-Ford; all-pairs small V→Floyd-Warshall.
- **Common patterns:** Network delay; path with constraints (cheapest flights ≤ k stops); minimize-the-maximum along a path (Dijkstra variant or binary search + BFS — connect back to Month 2!); grid Dijkstra (Path With Minimum Effort).
- **Visualization:** Simulate Dijkstra by hand on a 6-node graph, maintaining the dist table and heap contents at each pop.
- **Complexity:** Dijkstra O((V+E) log V); Bellman-Ford O(V·E); Floyd-Warshall O(V³).
- **Common mistakes:** Dijkstra with negative weights; processing stale heap entries without the `if d > dist[u]: continue` guard; Bellman-Ford k-stops variant without the previous-round snapshot.
- **Interview tips:** Recognition: _"minimum cost/time/effort path"_ + weights → Dijkstra. State the algorithm choice and WHY before coding — that decision is half the interview points.

### Topic: Minimum Spanning Tree

- **Theory:** MST definition; cut property (intuition); **Kruskal's** (sort edges + DSU); **Prim's** (heap-grown frontier); when each is natural (edge list → Kruskal; dense/adjacency → Prim).
- **Common patterns:** Min cost to connect all points/cities; MST on implicit complete graphs (Manhattan distances).
- **Complexity:** Kruskal O(E log E); Prim O(E log V).
- **Common mistakes:** Forgetting DSU cycle-skip in Kruskal; connecting already-connected components.
- **Interview tips:** Recognition: _"connect all X with minimum total cost"_. Less common than Dijkstra but a clean win when it appears.

**Daily tasks:**

- D1: Dijkstra theory + implement; Network Delay Time
- D2: Path With Minimum Effort, Cheapest Flights Within K Stops (Bellman-Ford variant)
- D3: Swim in Rising Water (hard — Dijkstra/binary-search hybrid), Path with Maximum Probability
- D4: MST theory + Min Cost to Connect All Points (both Kruskal & Prim)
- D5: Connecting Cities With Minimum Cost (or re-solve with the other algorithm), Find the City With the Smallest Number of Neighbors (Floyd-Warshall)
- D6: Contest. D7: Revision.

**Week 15 total: ~10 problems (heavier per-problem).**

### ✅ CHECKPOINT 12

- Implement Dijkstra from memory with the stale-entry guard.
- Given 4 shortest-path problem descriptions, name the right algorithm for each in <2 min.

## Week 16: Graph Consolidation + Mixed Mock Block

- D1–2: Mixed unlabeled graph set: Word Ladder (BFS on word-graph — hard), Evaluate Division (weighted DFS/DSU), Reorder Routes to Make All Paths Lead to the City Zero, Snakes and Ladders
- D3: Grid + graph hybrid day: Shortest Path in a Grid with Obstacles Elimination (hard, BFS + state), Number of Enclaves
- D4: Full 60-min mock: 1 traversal Medium + 1 topo/DSU Medium.
- D5: Weak-topic surgery + re-implement all graph templates (BFS, DFS, Kahn, DSU, Dijkstra, Kruskal) from memory in one sitting — your "graph gauntlet."
- D6: Contest + upsolve. D7: **Monthly evaluation.**

**Week 16 total: ~8 problems + gauntlet. Month 4 total: ~45–50 problems (cumulative ≈ 230).**

## 🏁 MONTH 4 MILESTONE

- **Milestone project:** Build a mini flight-route planner: load a city/edge dataset, answer shortest-path (Dijkstra), cheapest-with-k-stops (Bellman-Ford), and min-cost-to-connect-all (Kruskal) queries via CLI.
- **Mock interview:** 2 back-to-back 45-min mocks in one day (stamina training) — one graph, one from Months 1–3 (retention check).
- **Metrics:** Graph Mediums ≤35 min; can name the correct algorithm for any graph prompt within 3 minutes.
- **Target rating:** ~1700.
- **Success checklist:** □ Graph gauntlet passed from memory □ Algorithm-selection reflex built □ Checkpoints 10–12 passed □ ~230 cumulative problems

---

# MONTH 5 — Greedy, Dynamic Programming, Bit Manipulation

**Goal:** Crack the hardest interview topic. DP is 4 of these weeks' focus for a reason. ~55 problems.
**Target rating:** ~1750–1850.

## Week 17: Greedy + Intervals + Bit Manipulation

### Topic: Greedy Algorithms

- **Theory:** Greedy = locally optimal choice → globally optimal (only when an **exchange argument** justifies it); greedy-choice property & optimal substructure; how to _disprove_ greedy with a counterexample (the key interview skill); classic proofs to study: activity selection (earliest finish time), fractional knapsack.
- **Common patterns (Greedy):** Interval scheduling (sort by END time); **merge intervals** (sort by START); jump-game reachability (furthest-reach sweep); two-pass candy/rating problems; heap-assisted greedy (task scheduler); sort + sweep.
- **Merge Intervals pattern specifically:** sort by start → iterate → overlap if start ≤ current end → extend end. Variants: insert interval, erase minimum to make non-overlapping, meeting rooms (chronological events or heap of end-times).
- **Visualization:** Draw intervals as horizontal bars on a number line — merge/overlap logic becomes visually trivial. For jump problems, draw the "reach" arc.
- **Complexity:** Usually O(n log n) from the sort.
- **Common mistakes:** Sorting by the wrong key (start vs end — end for "max non-overlapping," start for "merge"); assuming greedy works without testing counterexamples; missing the "touching vs overlapping" boundary (≤ vs <).
- **Interview tips:** When you propose greedy, immediately try to break it out loud with a small counterexample. Interviewers love this; if you can't break it, sketch the exchange argument in one sentence.

### Topic: Bit Manipulation

- **Theory:** Binary representation, two's complement; operators (& | ^ ~ << >>); key identities — x & (x−1) clears lowest set bit, x & (−x) isolates it, XOR self-cancellation (a^a=0, a^0=a); bit masking as sets (check/set/clear bit i); counting bits; XOR swap; iterating submasks (CP-flavored, awareness only).
- **Common patterns:** Single number via XOR; count set bits (Kernighan); power-of-two check; bitmask as subset state (→ bitmask DP later); missing number via XOR or sum.
- **Visualization:** Write numbers in binary in columns; XOR problems become obvious column-wise.
- **Complexity:** O(1) per op; O(number of set bits) for Kernighan loops.
- **Common mistakes:** Operator precedence (& binds looser than == — parenthesize!); shifting beyond width; sign issues with >> in some languages.
- **Interview tips:** Recognition: _"appears once/twice"_, _"without using +"_, _O(1) space over pairs_ → think XOR. Low frequency at interviews but very high value-per-minute to learn.

**Daily tasks:**

- D1: Greedy theory + Jump Game, Jump Game II, Assign Cookies
- D2: Merge Intervals, Insert Interval, Non-overlapping Intervals
- D3: Meeting Rooms, Meeting Rooms II, Gas Station
- D4: Hand of Straights, Partition Labels, Candy (hard, two-pass)
- D5: Bit theory + Single Number, Number of 1 Bits, Counting Bits, Missing Number, Reverse Bits, Sum of Two Integers
- D6: Contest. D7: Revision.

**Week 17 total: ~17 problems (bit problems are quick).**

### ✅ CHECKPOINT 13

- Given 3 interval problems, choose the correct sort key with justification.
- Produce a counterexample for a plausible-but-wrong greedy on demand.
- Explain x & (x−1) and use it in Counting Bits.

## Weeks 18–19: Dynamic Programming Core

### Topic: Dynamic Programming

- **Theory (the 5-step framework — apply to EVERY problem):**
  1. **Define the state** in English: "dp[i] = the answer for the first i elements / ending at i."
  2. **Write the recurrence**: dp[i] in terms of smaller states.
  3. **Base cases.**
  4. **Order of computation** (or memoize and let recursion order itself).
  5. **Optimize space** if only recent states are used.
     Also: overlapping subproblems + optimal substructure (the two preconditions); **top-down memoization vs bottom-up tabulation** (learn top-down first — it's just recursion + cache, connecting to Month 2; convert to bottom-up second); recognizing DP: "count ways," "min/max cost," "can it be done," with choices at each step and n too big for brute force.
- **The core DP patterns (learn as named patterns):**
  1. **Linear / Fibonacci-style:** dp[i] from dp[i−1], dp[i−2] — Climbing Stairs, House Robber, Min Cost Climbing Stairs, Decode Ways
  2. **Grid paths:** dp[r][c] from top/left — Unique Paths, Min Path Sum
  3. **0/1 Knapsack (choose/skip with capacity):** Partition Equal Subset Sum, Target Sum — iterate capacity BACKWARD for 1D
  4. **Unbounded knapsack:** Coin Change, Coin Change II — iterate capacity FORWARD; loop-order determines combinations vs permutations (Coin Change II vs Combination Sum IV — understand this deeply!)
  5. **Longest Common Subsequence family (2D two-sequence):** LCS, Edit Distance, Delete Operation for Two Strings
  6. **Longest Increasing Subsequence:** O(n²) DP and O(n log n) patience/tails version (binary search returns!)
  7. **Palindrome DP:** Longest Palindromic Substring/Subsequence, Palindromic Substrings — expand-around-center vs interval DP
  8. **Interval DP:** dp[i][j] over subarray [i..j], loop by length — Burst Balloons, Matrix Chain intuition
  9. **State-machine DP:** Best Time to Buy and Sell Stock with Cooldown/Fee — states = holding/not-holding
  10. **Bitmask DP (intro):** dp[mask] over subsets — Partition to K Equal Sum Subsets (full treatment Month 6)
- **Visualization:** For 1D DP, write the dp array and fill it by hand for a small input. For 2D, draw the table and shade which cells feed each cell. For memoization, draw the recursion tree and CROSS OUT the pruned repeated subtrees — seeing the savings builds belief.
- **Complexity:** #states × work-per-state. Say it exactly this way in interviews.
- **Common mistakes:** Vague state definitions ("dp[i] is something about i" — be precise or die debugging); wrong iteration direction in knapsack 1D; indexing confusion between "first i items" (size n+1) and "item i" (size n); memoizing on mutable/global state; jumping to tabulation before the recurrence is clear.
- **Interview tips:** ALWAYS start by stating the state definition out loud — it's the highest-signal sentence in a DP interview. If stuck, solve it as brute-force recursion first, then add a cache: that alone is a passing answer at most companies. Recognition: min/max/count over sequences of choices, n ≤ ~10³–10⁴.
- **Revision strategy:** One flashcard per pattern with: recognition signal, state definition, recurrence. Re-solve Coin Change, LCS, and LIS at 1/3/7/21. Every revision day: pick one solved DP problem and re-derive it top-down AND bottom-up.

**Week 18 daily tasks (1D + knapsack):**

- D1: Framework + Climbing Stairs (3 ways: naive/memo/tab), Min Cost Climbing Stairs, House Robber
- D2: House Robber II, Decode Ways, Maximum Subarray (Kadane's = DP!)
- D3: Coin Change, Coin Change II (dwell on loop order!)
- D4: Partition Equal Subset Sum, Target Sum
- D5: Word Break, Combination Sum IV (contrast with Coin Change II)
- D6: Contest + Perfect Squares. D7: Revision.

**Week 19 daily tasks (2D + sequences):**

- D1: Unique Paths, Minimum Path Sum, Unique Paths II
- D2: Longest Common Subsequence, Edit Distance
- D3: Longest Increasing Subsequence (both O(n²) and O(n log n)), Maximum Product Subarray
- D4: Longest Palindromic Substring, Palindromic Substrings, Longest Palindromic Subsequence
- D5: Best Time to Buy and Sell Stock with Cooldown, Best Time II (greedy!) — compare greedy vs DP framing
- D6: Contest + Burst Balloons (hard, interval DP — attempt with hints). D7: Revision.

**Weeks 18–19 total: ~26 problems.**

### ✅ CHECKPOINT 14 (the big one)

- For any of the 10 patterns, recite: recognition signal → state → recurrence.
- Solve Coin Change and LCS from scratch, both directions, <30 min each.
- Explain why Coin Change II and Combination Sum IV differ only in loop order.

## Week 20: DP Depth + Month Consolidation

- D1: Tree DP: House Robber III (full solve now), Binary Tree Maximum Path Sum (re-solve — it was DP all along)
- D2: String DP: Distinct Subsequences (hard), Interleaving String
- D3: Harder classics: Longest Valid Parentheses (hard — stack AND DP solutions), Maximal Square
- D4: Full 60-min mock: 1 greedy + 1 DP Medium.
- D5: DP pattern flashcard marathon + re-derive 5 previously solved DP problems from state definitions alone.
- D6: Contest + upsolve. D7: **Monthly evaluation.**

**Week 20 total: ~8 problems. Month 5 total: ~50 problems (cumulative ≈ 280).**

## 🏁 MONTH 5 MILESTONE

- **Milestone project:** Write a "DP pattern handbook" in your own words: for each of the 10 patterns — recognition signal, state, recurrence, one solved example with your code. (Teaching-to-yourself is the strongest consolidation tool known.)
- **Mock interview:** 45-min DP-focused mock. DP under pressure is a different sport than DP at leisure — practice the pressure.
- **Metrics:** DP Medium first-attempt ≥50%; can classify a DP problem's pattern within 5 min ≥80% of the time.
- **Target rating:** ~1800.
- **Success checklist:** □ 10 patterns with flashcards □ Checkpoint 14 passed □ Handbook written □ ~280 cumulative problems

---

# MONTH 6 — Advanced Topics + Full Interview Mode

**Goal:** Cover the advanced tail, then convert knowledge into interview performance. ~50 problems + heavy mock volume.
**Target rating:** ~1850–1950+.

## Week 21: Segment Trees, Fenwick Trees, String Algorithms

### Topic: Segment Tree

- **Theory:** Array-backed binary tree over ranges; build O(n), point update O(log n), range query O(log n); supported ops (sum/min/max/gcd — any associative op); lazy propagation for range updates (concept + one implementation); when needed: _both_ updates AND range queries (static → prefix sums suffice; point-query-only → simpler structures).
- **Visualization:** Draw the tree over an 8-element array with node ranges labeled; trace one query showing which nodes are visited (the O(log n) "fringe").
- **Complexity:** Build O(n); query/update O(log n); space O(4n).
- **Common mistakes:** Off-by-one in range splits; forgetting to push lazy tags before descending; using a segment tree where prefix sums suffice (over-engineering flags weak judgment in interviews).
- **Interview tips:** Rare at FAANG interviews (more common in CP and at trading firms). Learn one clean recursive template; recognition: _"range query + updates interleaved."_

### Topic: Fenwick Tree (Binary Indexed Tree)

- **Theory:** Implicit tree via lowbit (i & −i); prefix-sum queries + point updates in O(log n); ~10 lines of code; count-inversions and "count smaller elements after self" applications; vs segment tree (BIT: less code, prefix-ops only; segtree: general ranges, min/max, lazy).
- **Complexity:** O(log n) update/query; O(n) space.
- **Common mistakes:** 0-indexed vs 1-indexed confusion (BITs are naturally 1-indexed); using BIT for min/max (doesn't work — not invertible).
- **Interview tips:** If asked, deriving "count smaller after self" with a BIT over value-ranks is a very strong senior-level signal.

### Topic: String Algorithms (deferred from Month 1)

- **Theory:** **KMP** (failure/LPS array — understand the prefix-function meaning, implement once); **Rabin-Karp** (rolling hash, collision awareness); Z-function (awareness); when built-in find() is fine to use in interviews (usually!) and when they want the real algorithm.
- **Interview tips:** Full KMP is rarely demanded; the LPS array concept appears in problems like Shortest Palindrome. Rolling hash is the more reusable tool (substring dedup, Rabin-Karp).

**Daily tasks:**

- D1: Segment tree theory + implement (sum + point update); Range Sum Query - Mutable
- D2: Lazy propagation study + implement range-add; solve one range-update exercise (e.g., Range Addition via difference array, then as lazy segtree)
- D3: BIT theory + implement; Count of Smaller Numbers After Self (hard)
- D4: Reverse Pairs (hard — merge-sort OR BIT; do both), Longest Increasing Subsequence (re-solve with BIT over values — third way!)
- D5: KMP theory + Implement strStr() / Find the Index of the First Occurrence, Repeated Substring Pattern, Longest Happy Prefix (LPS application)
- D6: Contest. D7: Revision.

**Week 21 total: ~9 problems (implementation-heavy).**

### ✅ CHECKPOINT 15

- Implement a sum segment tree and a BIT from memory.
- Articulate exactly when you'd use: prefix sum vs BIT vs segment tree.

## Week 22: Advanced Graphs + Advanced DP

### Topic: Advanced Graph Algorithms

- **Theory (awareness → working knowledge):** **Bidirectional BFS** (meet in the middle — halves the exponent; Word Ladder speedup); **A\*** concept (Dijkstra + admissible heuristic); **Tarjan's bridges/articulation points** (low-link values — implement bridges once: Critical Connections in a Network); **SCCs** (Kosaraju conceptually); **Eulerian path** (Hierholzer's — Reconstruct Itinerary); grid-state BFS (position + extra state dimension).
- **Interview tips:** Critical Connections and Reconstruct Itinerary are real FAANG questions; the rest is mostly CP. Know names + when they apply even where you skip implementation.

### Topic: Advanced DP Patterns

- **Theory:** **Bitmask DP** properly (dp over subsets; O(2ⁿ·n) transitions; TSP-style; assignment problems); **DP on digits** (awareness); **DP + binary search** (LIS n log n revisited; Russian Doll Envelopes); **DP on trees** (rerooting concept); **Kadane's extensions** (max product, circular subarray); **space-optimized rolling arrays** as a habit; **memoized DFS on grids** (Longest Increasing Path in a Matrix — where graphs and DP fuse).
- **Common mistakes:** Bitmask off-by-one on (1 << n); forgetting to check bit membership before transitioning; state explosion from over-rich states (always ask "what's the minimal state?").
- **Interview tips:** Bitmask DP recognition: n ≤ ~20 and "assign/visit each exactly once." Saying "n ≤ 20 suggests exponential-in-n with bitmask" earns instant credibility.

**Daily tasks:**

- D1: Critical Connections in a Network (hard — Tarjan bridges), Reconstruct Itinerary (hard)
- D2: Word Ladder re-solve with bidirectional BFS; Bus Routes (hard, BFS on route-graph)
- D3: Bitmask DP: Partition to K Equal Sum Subsets, Shortest Path Visiting All Nodes (hard)
- D4: Longest Increasing Path in a Matrix (hard), Russian Doll Envelopes (hard)
- D5: Maximum Product Subarray (re-solve), Maximum Sum Circular Subarray, Cherry Pickup II (hard — attempt with hints)
- D6: Contest. D7: Revision.

**Week 22 total: ~11 problems.**

### ✅ CHECKPOINT 16

- Solve Longest Increasing Path (memoized DFS) from scratch.
- Set up the bitmask DP state for a TSP-style prompt in <10 min.

## Weeks 23–24: FULL INTERVIEW MODE

No new topics. Convert skill into performance.

**Week 23 — Simulation week:**

- D1: 2× 45-min mocks (random topics from the Top-100 list below). Grade with the rubric: communication / approach / correctness / complexity / testing.
- D2: Blind-spot day — resolve every mock failure topic with 3 targeted problems each.
- D3: 2× 45-min mocks (at least one Hard attempt).
- D4: Speed day: 6 Mediums, 25-min cap each, from your weakest three topics.
- D5: 1 mock + behavioral prep (STAR stories: conflict, failure, leadership, ambiguity — write 6 stories).
- D6: Rated contest + full upsolve. D7: Revision + flashcard sweep of ALL patterns.

**Week 24 — Final polish:**

- D1–3: The Final 30 (last section) — re-solve 10/day of the most interview-critical problems from memory, timed.
- D4: Full onsite simulation: 3 back-to-back 45-min mocks with 15-min breaks (endurance is trainable and tested).
- D5: Weakness surgery — final targeted fixes from D4 notes.
- D6: Light contest + review. D7: **Final evaluation + celebrate.**

**Month 6 total: ~45 problems + 10 mocks (cumulative ≈ 320–330 problems).**

## 🏁 MONTH 6 / FINAL MILESTONE

- **Milestone project:** Publish your DP handbook + pattern flashcards as a public GitHub repo/blog post. Explaining publicly is the final boss of understanding — and it's résumé material.
- **Mock interviews:** ≥8 full mocks this month, ≥2 with strangers (Pramp/interviewing.io).
- **Final metrics:** Medium first-attempt ≥65% (≤30 min avg); can attempt Hards methodically; contest rating ~1850–1950; all 16 checkpoints passed.
- **Success checklist:** □ 300+ problems □ All patterns flashcarded & current □ 15+ total mocks done □ Behavioral stories written □ Can re-derive any template from memory

---

# Part 2: The Pattern Playbook (Master Reference)

For each pattern: **Signal** (how to recognize it) → **Action**.

| #   | Pattern                 | Recognition Signal                                                    | Core Action                                    |
| --- | ----------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Two Pointers            | Sorted array + pair/triplet; in-place O(1) space                      | Converge from ends / read-write pointers       |
| 2   | Fast & Slow Pointer     | Cycle detection; middle of list; "meet" problems                      | Slow ×1, fast ×2; Floyd's for cycle start      |
| 3   | Sliding Window          | Contiguous subarray/substring + longest/shortest/count with condition | Expand right, shrink left while invalid        |
| 4   | Prefix Sum (+ HashMap)  | Many range queries; count subarrays with sum k                        | prefix[j]−prefix[i]=k ⟺ lookup prefix[j]−k     |
| 5   | Monotonic Stack         | Next/previous greater/smaller; spans; histograms                      | Pop while violated; each element in/out once   |
| 6   | Binary Search on Answer | "Min value such that feasible" / minimize max                         | FFFTTT boundary; feasibility check O(n)        |
| 7   | Merge Intervals         | Overlapping ranges; scheduling                                        | Sort by start; extend end while overlapping    |
| 8   | Cyclic Sort             | Values in [1..n]; find missing/duplicate O(1) space                   | Swap each value to its index until settled     |
| 9   | Top-K Elements          | k largest/closest/frequent; streaming                                 | Min-heap of size k (or quickselect)            |
| 10  | Two Heaps               | Running median; balance two halves                                    | Max-heap lows + min-heap highs, rebalance      |
| 11  | Tree DFS                | Path sums, diameters, subtree properties                              | Combine left/right returns; global vs return   |
| 12  | Tree BFS                | Anything "per level"                                                  | Queue; process len(queue) nodes per round      |
| 13  | Graph BFS               | Shortest steps, unweighted spread                                     | Queue + visited-at-enqueue; multi-source seeds |
| 14  | Graph DFS               | Components, existence, flood fill                                     | Recurse + visited; iterative for deep grids    |
| 15  | Topological Sort        | Prerequisites, dependencies, ordering                                 | Kahn's: in-degrees + queue of zeros            |
| 16  | Union-Find              | Merging groups, dynamic connectivity                                  | find w/ compression + union by rank            |
| 17  | Dijkstra                | Min-cost path, non-negative weights                                   | Heap of (dist, node) + stale-entry guard       |
| 18  | Backtracking            | "All possible…", n ≤ 20                                               | Choose → explore → un-choose (+ prune)         |
| 19  | 0/1 Knapsack DP         | Choose/skip items under capacity                                      | dp[cap] backward iteration                     |
| 20  | Unbounded Knapsack DP   | Unlimited reuse (coins)                                               | dp[cap] forward; loop order = comb vs perm     |
| 21  | LCS-family DP           | Two sequences compared                                                | 2D table; match → diagonal+1                   |
| 22  | LIS                     | Ordered subsequence, "increasing"                                     | tails array + binary search O(n log n)         |
| 23  | Interval DP             | Answer over [i..j]; "last operation" framing                          | Loop by length; split point k                  |
| 24  | State-machine DP        | Buy/sell, hold/rest phases                                            | One dp per state; transitions between          |
| 25  | Bitmask DP              | n ≤ 20, visit/assign each once                                        | dp[mask]; iterate set/unset bits               |
| 26  | Greedy + Sort           | Scheduling, min resources                                             | Sort by the exchange-argument key              |
| 27  | XOR Tricks              | Appears once/twice; O(1) space pairing                                | Self-cancellation; x&(x−1)                     |

---

# Part 3: How to Think — The Problem-Solving Operating System

## 3.1 The 8-Step Solve Protocol (use on EVERY problem)

1. **Restate** the problem in your own words. Confirm inputs/outputs/constraints.
2. **Probe constraints:** n's size → allowed complexity (n≤20: exponential; n≤10³: n²; n≤10⁵: n log n; n≤10⁷: n). This alone often reveals the intended technique.
3. **Work 2–3 small examples by hand,** including one edge case. Watch what YOUR BRAIN does — your manual process often IS the algorithm.
4. **Pattern-match:** scan the playbook signals. Sorted? Contiguous? "All possible"? Prerequisites? K-th?
5. **Brute force first, out loud.** State it and its complexity even if you won't code it. It's a safety net AND the seed of the optimization.
6. **Optimize:** find the redundant work in the brute force. Repeated lookups → hash map. Repeated subproblems → memoize. Re-scanning windows → slide. Re-sorting → heap. Searching monotonic space → binary search.
7. **Code cleanly** with narration. Small helper functions. Meaningful names.
8. **Test before declaring done:** trace your code (not your intention — your literal code) on a small case + one edge case (empty, single element, duplicates, extremes).

## 3.2 How to Get Unstuck (in order)

1. Re-read the problem — 30% of stuckness is a misread.
2. Solve a simpler version (smaller n, 1D instead of 2D, no duplicates) then generalize.
3. Solve it backward (from the answer/end state).
4. Ask "what would I precompute to make the inner question O(1)?"
5. Try the constraint trick (step 2 above) — what complexity is it BEGGING for?
6. Change representation: array→graph? string→frequency vector? tree→list via traversal?
7. In practice: 45 min stuck → read ONLY the first hint / the approach name, then attempt again. Never read code first.
8. In interviews: think aloud through options 1–6 — exploring dead ends verbally scores points; silence scores none.

## 3.3 Debugging Efficiently

- Reproduce on the SMALLEST failing input (shrink it yourself).
- Trace by hand with a variable table — line by line, no skimming.
- Check the usual suspects in order: off-by-one boundaries → empty/size-1 inputs → duplicate handling → integer edge cases → visited/reset state between calls.
- Rubber-duck: explain each line's purpose out loud; the bug announces itself at the line where your explanation stutters.
- In interviews, debug transparently: "Let me trace with [3,1] … left becomes 1, ah — my condition should be <=."

## 3.4 Interview Communication Rules

- Think aloud ALWAYS. The interview is scored on process, not just output.
- Ask 2–3 clarifying questions before any solution (empty input? duplicates? value ranges? sorted?).
- Announce the plan and get a nod BEFORE coding. Coding an un-agreed solution is the most common self-sabotage.
- State time/space complexity unprompted, before and after coding.
- When given a hint, USE it enthusiastically — hint-adoption is a scored trait.
- Manage time: ~5 min understand, ~10 min design, ~20 min code, ~5–10 min test. Ask permission to start coding.

---

# Part 4: Resources

## YouTube (pick a primary, don't hoard)

- **NeetCode** — the gold standard for pattern-based LeetCode explanations; follow his roadmap ordering alongside this one.
- **Abdul Bari (Algorithms)** — deepest intuition for classic algorithms (sorting, graphs, DP theory).
- **William Fiset (Graph Theory + Data Structures)** — the best free graph-algorithms course anywhere.
- **Tushar Roy** — legacy but excellent DP table walkthroughs.
- **Errichto / Colin Galen** — when you move to competitive programming.
- **takeUforward (Striver)** — comprehensive A-to-Z sheets and explanations, great India-centric interview focus.

## Books

- _Grokking Algorithms_ (Bhargava) — Month 1 companion; friendliest intro alive.
- _A Common-Sense Guide to Data Structures and Algorithms_ (Wengrow) — alternative gentle intro.
- _Cracking the Coding Interview_ (McDowell) — interview process + behavioral, Months 4–6.
- _Elements of Programming Interviews_ (in your language) — harder drills, Months 5–6.
- _Algorithm Design Manual_ (Skiena) — the "how to think" book; war stories are gold.
- _Introduction to Algorithms_ (CLRS) — reference only; do not read cover to cover.
- _Competitive Programmer's Handbook_ (Laaksonen, free PDF) — for the CP transition.

## Websites

- **LeetCode** — primary drill ground (buy Premium in Months 4–6 if targeting specific companies; company-tagged lists are worth it).
- **NeetCode.io** — the 150/250 lists map closely to this roadmap; use its pattern grouping.
- **VisuAlgo.net** — animations for every classic structure/algorithm.
- **Pythontutor.com** — step-through code visualization; use heavily in Months 1–2.
- **CS50 / MIT 6.006 (OCW)** — lecture depth when a topic won't click.
- **Pramp / interviewing.io** — free & paid peer mocks.
- **CP-Algorithms.com** — advanced algorithm references (Month 6+).
- **Codeforces / AtCoder** — for the CP transition.

## Notes, Flashcards, Spaced Repetition

- **Notes strategy:** One page per TOPIC (not per problem): the template code, recognition signals, top-3 mistakes, links to your 5 best solved examples. Handwrite the first version (encoding benefit), digitize into Notion/Obsidian for search.
- **Flashcard strategy (Anki):** Three card types — (1) _Pattern cards_: front = problem description, back = pattern name + one-line approach (NOT full code); (2) _Template cards_: front = "binary search template," back = the code; (3) _Complexity cards_: front = operation, back = big-O. Target ≤15 new cards/week; review daily 15 min (Block 5).
- **Spaced repetition schedule for problems:** Re-solve at **+1 day → +3 days → +7 days → +21 days**. Only "important" problems enter the queue (checkpoint problems, first-of-a-pattern, and anything you failed). Keep the queue in a simple spreadsheet with due dates. If a re-solve fails, reset its clock to +1.

---

# Part 5: The Top 300 LeetCode Problems — In Solving Order

Solve strictly in order within each block; blocks follow the roadmap months. E = Easy, M = Medium, H = Hard. (★ = also on the Top-100 interview list.)

## Block 1 — Arrays, Strings, Hashing (Month 1) [1–45]

1. Two Sum (E) ★ 2. Best Time to Buy and Sell Stock (E) ★ 3. Remove Duplicates from Sorted Array (E) 4. Merge Sorted Array (E) ★ 5. Move Zeroes (E) 6. Plus One (E) 7. Rotate Array (M) 8. Contains Duplicate (E) ★ 9. Valid Anagram (E) ★ 10. Valid Palindrome (E) ★ 11. Longest Common Prefix (E) 12. Intersection of Two Arrays II (E) 13. Ransom Note (E) 14. First Unique Character in a String (E) 15. Isomorphic Strings (E) 16. Majority Element (E) ★ 17. Squares of a Sorted Array (E) 18. Product of Array Except Self (M) ★ 19. Group Anagrams (M) ★ 20. Top K Frequent Elements (M) ★ 21. Longest Consecutive Sequence (M) ★ 22. Encode and Decode Strings (M) 23. Valid Sudoku (M) 24. Spiral Matrix (M) ★ 25. Rotate Image (M) ★ 26. Set Matrix Zeroes (M) ★ 27. Insert Delete GetRandom O(1) (M) 28. Two Sum II (M) 29. Valid Palindrome II (E) 30. Remove Element (E) 31. 3Sum (M) ★ 32. Container With Most Water (M) ★ 33. Sort Colors (M) ★ 34. Trapping Rain Water (H) ★ 35. Maximum Average Subarray I (E) 36. Longest Substring Without Repeating Characters (M) ★ 37. Permutation in String (M) 38. Longest Repeating Character Replacement (M) ★ 39. Minimum Window Substring (H) ★ 40. Find Pivot Index (E) 41. Range Sum Query - Immutable (E) 42. Subarray Sum Equals K (M) ★ 43. Contiguous Array (M) 44. Range Sum Query 2D - Immutable (M) 45. Longest Palindromic Substring (M) ★

## Block 2 — Binary Search, Sorting, Recursion, Linked List, Stack/Queue (Month 2) [46–95]

46. Binary Search (E) 47. First Bad Version (E) 48. Search Insert Position (E) 49. Find First and Last Position (M) 50. Search in Rotated Sorted Array (M) ★ 51. Find Minimum in Rotated Sorted Array (M) ★ 52. Koko Eating Bananas (M) ★ 53. Capacity To Ship Packages Within D Days (M) 54. Split Array Largest Sum (H) 55. Search a 2D Matrix (M) ★ 56. Kth Largest Element in an Array (M) ★ 57. Sort an Array (M) 58. Median of Two Sorted Arrays (H) ★ 59. Pow(x, n) (M) ★ 60. Climbing Stairs (E) ★ 61. Merge Two Sorted Lists (E) ★ 62. Subsets (M) ★ 63. Permutations (M) ★ 64. Letter Combinations of a Phone Number (M) ★ 65. Generate Parentheses (M) ★ 66. Reverse Linked List (E) ★ 67. Middle of the Linked List (E) 68. Design Linked List (M) 69. Linked List Cycle (E) ★ 70. Linked List Cycle II (M) 71. Remove Nth Node From End of List (M) ★ 72. Palindrome Linked List (E) ★ 73. Reorder List (M) ★ 74. Add Two Numbers (M) ★ 75. Copy List with Random Pointer (M) ★ 76. Reverse Linked List II (M) 77. Swap Nodes in Pairs (M) 78. Merge k Sorted Lists (H) ★ 79. Reverse Nodes in k-Group (H) 80. Valid Parentheses (E) ★ 81. Min Stack (M) ★ 82. Implement Queue using Stacks (E) 83. Evaluate Reverse Polish Notation (M) ★ 84. Daily Temperatures (M) ★ 85. Next Greater Element I (E) 86. Next Greater Element II (M) 87. Asteroid Collision (M) 88. Car Fleet (M) 89. Largest Rectangle in Histogram (H) ★ 90. Sliding Window Maximum (H) ★ 91. Decode String (M) 92. Design Circular Queue (M) 93. LRU Cache (M) ★ 94. Basic Calculator II (M) 95. Remove K Digits (M)

## Block 3 — Trees, BST, Heap, Trie, Backtracking (Month 3) [96–150]

96. Maximum Depth of Binary Tree (E) ★ 97. Invert Binary Tree (E) ★ 98. Same Tree (E) ★ 99. Symmetric Tree (E) 100. Path Sum (E) 101. Diameter of Binary Tree (E) ★ 102. Balanced Binary Tree (E) ★ 103. Binary Tree Level Order Traversal (M) ★ 104. Binary Tree Right Side View (M) ★ 105. Binary Tree Zigzag Level Order Traversal (M) 106. Count Good Nodes in Binary Tree (M) 107. Lowest Common Ancestor of a Binary Tree (M) ★ 108. Construct Binary Tree from Preorder and Inorder (M) ★ 109. Binary Tree Maximum Path Sum (H) ★ 110. Serialize and Deserialize Binary Tree (H) ★ 111. Subtree of Another Tree (E) ★ 112. Sum Root to Leaf Numbers (M) 113. Flatten Binary Tree to Linked List (M) 114. Search in a BST (E) 115. Insert into a BST (M) 116. Validate Binary Search Tree (M) ★ 117. Kth Smallest Element in a BST (M) ★ 118. Lowest Common Ancestor of a BST (M) ★ 119. Convert Sorted Array to BST (E) 120. Delete Node in a BST (M) 121. Two Sum IV (E) 122. Kth Largest Element in a Stream (E) 123. Last Stone Weight (E) 124. K Closest Points to Origin (M) ★ 125. Task Scheduler (M) ★ 126. Find Median from Data Stream (H) ★ 127. Implement Trie (Prefix Tree) (M) ★ 128. Design Add and Search Words Data Structure (M) ★ 129. Replace Words (M) 130. Word Search II (H) ★ 131. Subsets II (M) 132. Permutations II (M) 133. Combinations (M) 134. Combination Sum (M) ★ 135. Combination Sum II (M) 136. Word Search (M) ★ 137. Palindrome Partitioning (M) ★ 138. N-Queens (H) ★ 139. Sudoku Solver (H) 140. Restore IP Addresses (M) 141. Letter Case Permutation (M) 142. House Robber III (M) 143. Binary Tree Level Order Traversal II (M) 144. Populating Next Right Pointers (M) 145. Design Twitter (M) 146. Path Sum II (M) 147. Binary Search Tree Iterator (M) 148. Trim a Binary Search Tree (M) 149. Maximum Width of Binary Tree (M) 150. Vertical Order Traversal of a Binary Tree (H)

## Block 4 — Graphs (Month 4) [151–195]

151. Find if Path Exists in Graph (E) 152. Number of Islands (M) ★ 153. Max Area of Island (M) 154. Flood Fill (E) 155. Number of Connected Components (M) ★ 156. Clone Graph (M) ★ 157. Rotting Oranges (M) ★ 158. Pacific Atlantic Water Flow (M) ★ 159. Surrounded Regions (M) ★ 160. Is Graph Bipartite? (M) 161. Shortest Path in Binary Matrix (M) 162. 01 Matrix (M) 163. Walls and Gates (M) 164. Course Schedule (M) ★ 165. Course Schedule II (M) ★ 166. Find Eventual Safe States (M) 167. Minimum Height Trees (M) 168. Alien Dictionary (H) ★ 169. Redundant Connection (M) ★ 170. Number of Provinces (M) 171. Accounts Merge (M) 172. Graph Valid Tree (M) ★ 173. Satisfiability of Equality Equations (M) 174. Network Delay Time (M) ★ 175. Path With Minimum Effort (M) 176. Cheapest Flights Within K Stops (M) ★ 177. Swim in Rising Water (H) ★ 178. Path with Maximum Probability (M) 179. Min Cost to Connect All Points (M) ★ 180. Connecting Cities With Minimum Cost (M) 181. Find the City With the Smallest Number of Neighbors (M) 182. Word Ladder (H) ★ 183. Word Ladder II (H) 184. Evaluate Division (M) 185. Reorder Routes (M) 186. Snakes and Ladders (M) 187. Shortest Path with Obstacles Elimination (H) 188. Number of Enclaves (M) 189. As Far from Land as Possible (M) 190. Open the Lock (M) 191. Minimum Genetic Mutation (M) 192. Keys and Rooms (M) 193. All Paths From Source to Target (M) 194. Find the Town Judge (E) 195. Shortest Bridge (M)

## Block 5 — Greedy, Intervals, Bits, DP (Month 5) [196–260]

196. Jump Game (M) ★ 197. Jump Game II (M) ★ 198. Assign Cookies (E) 199. Merge Intervals (M) ★ 200. Insert Interval (M) ★ 201. Non-overlapping Intervals (M) ★ 202. Meeting Rooms (E) ★ 203. Meeting Rooms II (M) ★ 204. Gas Station (M) ★ 205. Hand of Straights (M) 206. Partition Labels (M) 207. Candy (H) 208. Single Number (E) ★ 209. Number of 1 Bits (E) ★ 210. Counting Bits (E) ★ 211. Missing Number (E) ★ 212. Reverse Bits (E) 213. Sum of Two Integers (M) 214. Single Number II (M) 215. Climbing Stairs — re-solve 3 ways (E) 216. Min Cost Climbing Stairs (E) 217. House Robber (M) ★ 218. House Robber II (M) ★ 219. Decode Ways (M) ★ 220. Maximum Subarray (M) ★ 221. Coin Change (M) ★ 222. Coin Change II (M) ★ 223. Partition Equal Subset Sum (M) ★ 224. Target Sum (M) 225. Word Break (M) ★ 226. Combination Sum IV (M) 227. Perfect Squares (M) 228. Unique Paths (M) ★ 229. Minimum Path Sum (M) ★ 230. Unique Paths II (M) 231. Longest Common Subsequence (M) ★ 232. Edit Distance (M) ★ 233. Longest Increasing Subsequence (M) ★ 234. Maximum Product Subarray (M) ★ 235. Palindromic Substrings (M) ★ 236. Longest Palindromic Subsequence (M) 237. Best Time to Buy and Sell Stock with Cooldown (M) ★ 238. Best Time to Buy and Sell Stock II (M) 239. Burst Balloons (H) ★ 240. Distinct Subsequences (H) 241. Interleaving String (M) ★ 242. Longest Valid Parentheses (H) 243. Maximal Square (M) ★ 244. Delete Operation for Two Strings (M) 245. Minimum Insertion Steps to Make a String Palindrome (H) 246. Partition to K Equal Sum Subsets (M) 247. Jump Game III (M) 248. Ones and Zeroes (M) 249. Last Stone Weight II (M) 250. Integer Break (M) 251. Arithmetic Slices (M) 252. Count Square Submatrices with All Ones (M) 253. Stone Game (M) 254. Predict the Winner (M) 255. Regular Expression Matching (H) ★ 256. Wildcard Matching (H) 257. Best Time to Buy and Sell Stock III (H) 258. Best Time to Buy and Sell Stock IV (H) 259. Paint House (M) 260. Minimum Cost For Tickets (M)

## Block 6 — Advanced (Month 6) [261–300]

261. Range Sum Query - Mutable (M) 262. Count of Smaller Numbers After Self (H) 263. Reverse Pairs (H) 264. Longest Increasing Subsequence — BIT re-solve (M) 265. Find the Index of the First Occurrence / strStr (E) 266. Repeated Substring Pattern (E) 267. Longest Happy Prefix (H) 268. Critical Connections in a Network (H) 269. Reconstruct Itinerary (H) 270. Bus Routes (H) 271. Shortest Path Visiting All Nodes (H) 272. Longest Increasing Path in a Matrix (H) ★ 273. Russian Doll Envelopes (H) 274. Maximum Sum Circular Subarray (M) 275. Cherry Pickup II (H) 276. Word Break II (H) 277. Palindrome Pairs (H) 278. Design In-Memory File System (H) 279. Insert Delete GetRandom O(1) - Duplicates allowed (H) 280. Basic Calculator (H) 281. Text Justification (H) 282. Minimum Number of Refueling Stops (H) 283. Employee Free Time (H) 284. The Skyline Problem (H) 285. Trapping Rain Water II (H) 286. Sliding Window Median (H) 287. Count Vowels Permutation (H) 288. Number of Ways to Stay in the Same Place (H) 289. Frog Jump (H) 290. Split Array into Fibonacci Sequence (M) 291. K-th Smallest in Lexicographical Order (H) 292. Design Search Autocomplete System (H) 293. Alien Dictionary — re-solve (H) 294. Median of Two Sorted Arrays — re-solve (H) 295. Merge k Sorted Lists — re-solve (H) 296. Minimum Window Substring — re-solve (H) 297. Trapping Rain Water — re-solve (H) 298. Binary Tree Maximum Path Sum — re-solve (H) 299. Word Search II — re-solve (H) 300. N-Queens — re-solve (H)

_(Note: the final 8 are deliberate re-solves of landmark Hards — retention is the point. Problem availability of a few premium-tagged ones — Meeting Rooms, Alien Dictionary, Walls and Gates, Encode/Decode Strings, Design In-Memory File System, Employee Free Time — requires LeetCode Premium; free equivalents exist on Lintcode/NeetCode if needed.)_

---

# Part 6: Top 100 Interview Questions

All problems marked ★ above form the Top-100 interview list — they're the highest-frequency questions across FAANG per company-tagged data, and this roadmap sequences them naturally. **The Final 30** (Week 24 drill list — must be flawless from memory):

Two Sum · Valid Parentheses · Merge Two Sorted Lists · Best Time to Buy and Sell Stock · Valid Anagram · Reverse Linked List · Maximum Subarray · Climbing Stairs · Binary Search · Number of Islands · Longest Substring Without Repeating Characters · 3Sum · Group Anagrams · Product of Array Except Self · Search in Rotated Sorted Array · Coin Change · Course Schedule · Validate BST · Kth Smallest in BST · LCA of Binary Tree · Binary Tree Level Order Traversal · Word Break · Longest Palindromic Substring · Merge Intervals · Rotting Oranges · LRU Cache · Trapping Rain Water · Merge k Sorted Lists · Median of Two Sorted Arrays · Minimum Window Substring

---

# Part 7: Final Revision Roadmap (Last 2 Weeks Before Any Interview)

**Days 14–11:** One pattern-family per half-day sweep (arrays/window → linked/stack → trees/heaps → graphs). For each: recite templates from memory, re-solve 3 landmark problems, review your mistake journal entries for the topic.
**Days 10–8:** DP intensive — all 10 pattern flashcards + re-solve Coin Change, LCS, LIS, Edit Distance, House Robber II from state definitions.
**Days 7–5:** 2 mocks/day, random topics; evening = fix what broke.
**Day 4:** The Final 30 speed run (target: recognize + outline all 30 in one sitting; fully code any 8).
**Day 3:** Behavioral stories rehearsal + company research + questions-to-ask list.
**Day 2:** ONE light mock, template flashcards only. Stop by evening.
**Day 1:** Rest. Sleep. Zero problems. (Cognitive performance on interview day beats one more Medium.)

---

# Part 8: FAANG Interview Preparation Plan

**Process overview:** Recruiter screen → Online Assessment (usually 2 problems, 90 min) → 1–2 phone screens (1 Medium each) → Onsite loop: 2–3 coding rounds + 1 behavioral + (1 system design if 2+ YOE). Coding rounds ≈ this roadmap's Medium level, occasionally Hard.

**Timeline (overlay on Months 5–6):**

- **T-8 weeks:** Applications + referrals out (referrals ≈ 5–10× reply rate; message engineers with a short specific note). Resume: quantified bullets, projects section featuring your milestone projects.
- **T-6 weeks:** Company-specific drilling — LeetCode Premium company tags, last-6-months sort, top 50 per target company. Company flavors (verify current patterns via recent interview reports, they shift): Google leans original problems + graphs/DP rigor; Meta leans speed (2 problems/round) from a known question pool; Amazon leans LP behavioral (14 Leadership Principles — prepare 2 stories each for the big 6) + standard Mediums.
- **T-4 weeks:** 3 mocks/week minimum, at least 1 with a stranger. OA practice under exact time limits.
- **T-2 weeks:** The Final Revision Roadmap above.
- **Behavioral (never skip):** 6–8 STAR stories covering: conflict, failure, leadership, ambiguity, deadline pressure, disagreement-with-authority. Rehearse aloud; 2-min ceilings.
- **Negotiation note:** Never give a number first; get competing offers in the same window if possible; levels.fyi for calibration.

---

# Part 9: After DSA — System Design & Competitive Programming Roadmaps

## 9.1 → System Design (for interviews with 2+ YOE, or senior roles)

**Month 7:** Fundamentals — client-server, DNS, HTTP, load balancers, horizontal vs vertical scaling, caching (Redis, CDN, cache-aside/write-through, eviction), databases (SQL vs NoSQL, indexing, replication, sharding), CAP theorem, consistency models. Resources: _System Design Interview Vol 1_ (Alex Xu), ByteByteGo, Gaurav Sen / Jordan Has No Life (YouTube).
**Month 8:** Building blocks — message queues (Kafka), pub/sub, rate limiting, consistent hashing, bloom filters, websockets/long-polling, microservices vs monolith, API design, back-of-envelope estimation (memorize the latency numbers table + QPS math).
**Month 9:** Case studies, one per 2–3 days, whiteboarded aloud in 45 min: URL shortener → rate limiter → key-value store → news feed → chat (WhatsApp) → notification system → Youtube → Uber → search autocomplete (your Month-3 project, at scale!) → payment system. Then _Designing Data-Intensive Applications_ (Kleppmann) for depth, and 4+ system design mocks.

## 9.2 → Competitive Programming

**Months 7–8:** Platform switch — Codeforces (do every Div 2/3 live, upsolve A–D religiously; upsolving is where growth lives) + AtCoder Beginner Contests. Learn the CP deltas: fast I/O, C++ STL mastery (if switching languages, worth it above ~1600), modular arithmetic, overflow discipline, constructive problems, interactive problems.
**Months 9–10:** Theory expansion via _Competitive Programmer's Handbook_ + CP-Algorithms: number theory (sieve, mod inverse, CRT), combinatorics (nCr precomputation), string algorithms (Z, hashing, suffix arrays), sqrt decomposition, sparse tables, LCA/binary lifting, HLD (awareness), game theory (Nim/Grundy), geometry basics, DP optimizations (divide & conquer opt, convex hull trick — awareness first).
**Months 11–12:** Rating grind — virtual contests 2×/week + 1 live; problem ladders slightly above your rating (rating+200 rule); target: Codeforces Specialist (1400+) by month 10, Expert (1600+) by month 12–14 with consistency. Join a community (Codeforces blogs, competitive Discords) — upsolve discussions accelerate everything.

---

## Final Words

Six months of this schedule is 700–900 hours of deliberate practice. The plan matters far less than the loop: **attempt → struggle → learn → re-solve on schedule → analyze mistakes**. Protect the revision days and the mistake journal above all else — they're the 20% that produces 80% of the results. Miss a day? Skip forward, don't compress; consistency across months beats intensity in any week.

You're not memorizing 300 solutions. You're installing ~27 patterns so deeply that problem 301 — the one you've never seen, in the interview that matters — feels familiar anyway. That's the whole game. Good luck. 🚀
