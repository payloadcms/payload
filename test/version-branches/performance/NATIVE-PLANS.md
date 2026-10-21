Written with AI

# Representative native execution evidence

Current implementation/harness SHA-256: `abffd4f63a62df57873c9f7e24c30abf96b292bd076c6425b691a4fa9f3ba2fa`. Final representatives select the smallest and largest available measured scenario per adapter; this is a plan sample, not full matrix approval. Only unchanged-source final reports count in [RESULTS.md](./RESULTS.md). Explicitly supplied historical diagnostics below retain their original failure status and cannot establish current performance.

These are compact summaries of actual captured native explanations, not compiler predictions. Statement and raw-report fingerprints tie summaries to the retained JSON; full SQL/pipelines, plans, samples and CPU profiles stay in the documented local artifact directory. Missing counters are labeled unavailable. PostgreSQL node counters overlap, and SQLite exposes no runtime rows-examined counter.

## mongodb-10000-2-1-0.01 — historical diagnostic; never final coverage

Report SHA-256: `8807ef2a7e2f5199eac87624d6c10dd533cfe87b914c9f44cbd57524bb17ea70`. Implementation source SHA-256: `unavailable (predates source pinning)`. Node v24.15.0; darwin/arm64; database version not recorded in this historical report.

Captured failure: AssertionError: expected false to be true // Object.is equality

Raw graph: 660 logical coordinates at depth 2 (not a native rows-examined counter). current-drafts-native-raw-graph: 16 native commands, p50/p95 10.076/11.582 ms; branch-guarded-core-raw-graph: 17 native commands, p50/p95 21.509/26.208 ms. Executed graph-plan scan counters were not captured; the raw report retains its native statements. Scalar native explanations follow.

### range-page-and-total / current-drafts-native

Calls: 2. Warm p50/p95: 4.935/5.203 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `a85e51d1907e35030caa1266371a498ed29811d4b5e0863d6f0ef45151e8849b`.

- Root execution: docs examined 15050, keys examined 15050, returned 1, execution ms 5.
- Winning plan stages: GROUP, FETCH, IXSCAN; indexes: version.ordinal_1.
- Cursor/lookup counters are reported separately and are not summed.

### range-page-and-total / branch-native

Calls: 1. Warm p50/p95: 4.011/4.356 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `f5f22575046951a8de97152255740a7804bc3cb839ca3df52ea1d88f6dae12f3`.

- Cursor stage 0: docs examined 5000, keys examined 5000, returned 5000, execution ms 4.
- Winning plan stages: FETCH, IXSCAN; indexes: _branchProjection.branchKey_1_ordinal_1.
- Cursor/lookup counters are reported separately and are not summed.

### range-page-and-total / published-native

Calls: 2. Warm p50/p95: 2.170/2.257 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `84c5f968f808fe2a598312e9734d0b6173a8d4c7f2f41f2003d428e7cd91e250`.

- Root execution: docs examined 0, keys examined 5000, returned 1, execution ms 0.
- Winning plan stages: GROUP, COUNT_SCAN; indexes: ordinal_1.
- Cursor/lookup counters are reported separately and are not summed.

### relationship-predicate / current-drafts-native

Calls: 3. Warm p50/p95: 5.247/5.366 ms. Returned/total: 20/100.

Statement 1 SHA-256: `b3311258cc2b8d100f197c991f4a2584083985ece0db478bb619ceba8c5aca1c`.

- Root execution: docs examined 10000, keys examined 10000, returned 1, execution ms 13.
- Winning plan stages: GROUP, FETCH, IXSCAN; indexes: latest_1.
- Cursor/lookup counters are reported separately and are not summed.

### relationship-predicate / branch-native

Calls: 1. Warm p50/p95: 2.318/2.385 ms. Returned/total: 20/100.

Statement 1 SHA-256: `51e20cffe3723377c50138b3bd21b71bfdcebbf5bdc834c1617c3779a4f07986`.

- Cursor stage 0: docs examined 100, keys examined 100, returned 100, execution ms 2.
- Lookup stage 1 (bq_e18a72f7b45959f9): docs examined 132, keys examined 132, collection scans 0, indexes related_1.
- Winning plan stages: PROJECTION_SIMPLE, FETCH, IXSCAN; indexes: _branchProjection.branchKey_1_ordinal_1.
- Cursor/lookup counters are reported separately and are not summed.

### relationship-predicate / published-native

Calls: 3. Warm p50/p95: 4.533/4.673 ms. Returned/total: 20/100.

Statement 1 SHA-256: `cc82c2d030d726b93b48db565d48ad3b58e243df787db42e5c202fcd71d08bdd`.

- Root execution: docs examined 10000, keys examined 10000, returned 1, execution ms 3.
- Winning plan stages: GROUP, FETCH, IXSCAN; indexes: ordinal_1.
- Cursor/lookup counters are reported separately and are not summed.

## postgres-10000-2-1-0.01 — historical diagnostic; never final coverage

Report SHA-256: `b489cf61f728efc31c9d134c9c4916e13052a4a5a075a2723ffa8f42b34324d5`. Implementation source SHA-256: `unavailable (predates source pinning)`. Node v24.15.0; darwin/arm64; database version not recorded in this historical report.

Captured failure: AssertionError: expected false to be true // Object.is equality

Raw graph: 660 logical coordinates at depth 2 (not a native rows-examined counter). current-drafts-native-raw-graph: 16 native commands, p50/p95 35.768/40.022 ms; branch-guarded-core-raw-graph: 18 native commands, p50/p95 66.024/72.015 ms. Executed graph-plan scan counters were not captured; the raw report retains its native statements. Scalar native explanations follow.

### range-page-and-total / current-drafts-native

Calls: 2. Warm p50/p95: 2.639/2.737 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `0ef82f5ef888c4d9d9f5307ad7f656755f1c35635f1672ffced5011378a8bc6f`.

- Executed plan nodes: Aggregate, Index Scan.
- Root actual rows/loop: 1; loops: 1; execution ms: 1.157.
- Root inclusive buffers hit/read: 265/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan _branch_performance_articles_v via _branch_performance_articles_v_version_version_ordinal_idx: rows/loop 5000, loops 1, removed by filter/loop 10050.

Statement 2 SHA-256: `500e55037dd17e2eba2d95282df90df91916c33b767337c5611758a339337645`.

- Executed plan nodes: Limit, Incremental Sort, Nested Loop, Index Scan, Aggregate, Sort.
- Root actual rows/loop: 20; loops: 1; execution ms: 0.202.
- Root inclusive buffers hit/read: 252/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan _branch_performance_articles_v via _branch_performance_articles_v_version_version_ordinal_idx: rows/loop 21, loops 1, removed by filter/loop 122.
- Index Scan _branch_performance_articles_v_blocks_section via _branch_performance_articles_v_blocks_section_parent_id_idx: rows/loop 0, loops 21, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_locales via _branch_performance_articles_v_blocks_section_locales_parent: rows/loop 2, loops 1, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items via _branch_performance_articles_v_blocks_section_items_parent_id_i: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items_locales via _branch_performance_articles_v_blocks_section_items_locales_: rows/loop 2, loops 4, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items_children via _branch_performance_articles_v_blocks_section_items_children_pa: rows/loop 3, loops 4, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items_children_lo via _branch_performance_articles_v_blocks_section_items_childr_1: rows/loop 2, loops 12, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_rels via _branch_performance_articles_v_rels_parent_idx: rows/loop 2, loops 21, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_locales via _branch_performance_articles_v_locales_parent_id_locale_uniq: rows/loop 2, loops 21, removed by filter/loop unavailable.

### range-page-and-total / branch-native

Calls: 1. Warm p50/p95: 5.164/5.401 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `9acc6e3b69a4229852af0205296fc280ed7e560f06b1aab9c9691296f731f19c`.

- Executed plan nodes: Sort, WindowAgg, Aggregate, Bitmap Heap Scan, Bitmap Index Scan, Limit, CTE Scan, Nested Loop, Index Scan, Seq Scan.
- Root actual rows/loop: 20; loops: 1; execution ms: 4.364.
- Root inclusive buffers hit/read: 689/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Bitmap Heap Scan bq_e18a72f7b45959f9: rows/loop 5000, loops 1, removed by filter/loop 5000.
- Bitmap Index Scan via _branchProjection_branchKey__branchProjection_isVisible_idx: rows/loop 10000, loops 1, removed by filter/loop unavailable.
- CTE Scan projection_all_ids: rows/loop 5000, loops 1, removed by filter/loop unavailable.
- CTE Scan projection_all_ids: rows/loop 5000, loops 1, removed by filter/loop unavailable.
- CTE Scan projection_selected_ids: rows/loop 20, loops 1, removed by filter/loop unavailable.
- Index Scan bq_e18a72f7b45959f9 via bq_e18a72f7b45959f9_pkey: rows/loop 1, loops 20, removed by filter/loop unavailable.
- Seq Scan bq_e18a72f7b45959f9_blocks_section: rows/loop 0, loops 20, removed by filter/loop 200.
- Bitmap Heap Scan bq_e18a72f7b45959f9_blocks_section_locales: rows/loop 2, loops 1, removed by filter/loop unavailable.
- Bitmap Index Scan via bq_e18a72f7b45959f9_blocks_section_locales_parent_id_locale_: rows/loop 2, loops 1, removed by filter/loop unavailable.
- Bitmap Heap Scan bq_e18a72f7b45959f9_blocks_section_items: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Bitmap Index Scan via bq_e18a72f7b45959f9_blocks_section_items_parent_id_idx: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Bitmap Heap Scan bq_e18a72f7b45959f9_blocks_section_items_locales: rows/loop 2, loops 4, removed by filter/loop unavailable.
- 21 scan nodes in complete plan; first 12 shown.

### range-page-and-total / published-native

Calls: 2. Warm p50/p95: 1.559/1.673 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `c7fe4cd0544b0bf66674e8ac4dc64ca60f7ba4309fe9e89ab7b845c8ce0d2040`.

- Executed plan nodes: Aggregate, Index Only Scan.
- Root actual rows/loop: 1; loops: 1; execution ms: 0.388.
- Root inclusive buffers hit/read: 64/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Only Scan branch_performance_articles via branch_performance_articles_ordinal_idx: rows/loop 5000, loops 1, removed by filter/loop unavailable.

Statement 2 SHA-256: `034fe4a4bad8efd493bf3f5e91bd1b0353535089578682d26b14d721c9e8cdb2`.

- Executed plan nodes: Limit, Incremental Sort, Nested Loop, Index Scan, Aggregate, Sort, Seq Scan, Bitmap Heap Scan, Bitmap Index Scan.
- Root actual rows/loop: 20; loops: 1; execution ms: 0.277.
- Root inclusive buffers hit/read: 214/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan branch_performance_articles via branch_performance_articles_ordinal_idx: rows/loop 21, loops 1, removed by filter/loop unavailable.
- Seq Scan branch_performance_articles_blocks_section: rows/loop 0, loops 21, removed by filter/loop 100.
- Seq Scan branch_performance_articles_blocks_section_locales: rows/loop 2, loops 1, removed by filter/loop 198.
- Bitmap Heap Scan branch_performance_articles_blocks_section_items: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Bitmap Index Scan via branch_performance_articles_blocks_section_items_parent_id_idx: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Bitmap Heap Scan branch_performance_articles_blocks_section_items_locales: rows/loop 2, loops 4, removed by filter/loop unavailable.
- Bitmap Index Scan via branch_performance_articles_blocks_section_items_locales_par: rows/loop 2, loops 4, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_blocks_section_items_children via branch_performance_articles_blocks_section_items_children_paren: rows/loop 3, loops 4, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_blocks_section_items_children_local via branch_performance_articles_blocks_section_items_children_lo: rows/loop 2, loops 12, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_rels via branch_performance_articles_rels_parent_idx: rows/loop 2, loops 21, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_locales via branch_performance_articles_locales_parent_id_locale_unique: rows/loop 2, loops 21, removed by filter/loop unavailable.

### relationship-predicate / current-drafts-native

Calls: 3. Warm p50/p95: 39.068/41.780 ms. Returned/total: 20/100.

Statement 1 SHA-256: `5a6835e9a870d5ba600efc6b9eca6db5d853f8d1947878cb2a46cbb368cb29dc`.

- Executed plan nodes: Limit, Unique, Sort, Hash Join, Nested Loop, Index Scan, Hash, Bitmap Heap Scan, Bitmap Index Scan.
- Root actual rows/loop: 20; loops: 1; execution ms: 2.123.
- Root inclusive buffers hit/read: 1788/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan branch_performance_articles via branch_performance_articles_ordinal_idx: rows/loop 100, loops 1, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_rels via _branch_performance_articles_v_rels_branch_performance_a_idx: rows/loop 35, loops 100, removed by filter/loop 0.
- Bitmap Heap Scan _branch_performance_articles_v: rows/loop 10000, loops 1, removed by filter/loop 0.
- Bitmap Index Scan via _branch_performance_articles_v_latest_idx: rows/loop 10000, loops 1, removed by filter/loop unavailable.

Statement 2 SHA-256: `7e28ece1c7c09e9fa7aaada82f6ede8896370c3b36cba84bbddc5ff9ae139fc3`.

- Executed plan nodes: Limit, WindowAgg, Group, Nested Loop, Merge Join, Index Scan, Memoize.
- Root actual rows/loop: 1; loops: 1; execution ms: 40.586.
- Root inclusive buffers hit/read: 34148/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan _branch_performance_articles_v via _branch_performance_articles_v_pkey: rows/loop 10000, loops 1, removed by filter/loop 20100.
- Index Scan _branch_performance_articles_v_rels via _branch_performance_articles_v_rels_parent_idx: rows/loop 349400, loops 1, removed by filter/loop 0.
- Index Scan branch_performance_articles via branch_performance_articles_pkey: rows/loop 0, loops 10000, removed by filter/loop 1.

Statement 3 SHA-256: `4a4396c84bc33d53875330ea4cceb7bf2ed39d71305c1751facf0a2dc3ddd2b7`.

- Executed plan nodes: Nested Loop, Index Scan, Aggregate, Sort.
- Root actual rows/loop: 20; loops: 1; execution ms: 0.213.
- Root inclusive buffers hit/read: 283/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan _branch_performance_articles_v via _branch_performance_articles_v_pkey: rows/loop 20, loops 1, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section via _branch_performance_articles_v_blocks_section_parent_id_idx: rows/loop 0, loops 20, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_locales via _branch_performance_articles_v_blocks_section_locales_parent: rows/loop 2, loops 1, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items via _branch_performance_articles_v_blocks_section_items_parent_id_i: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items_locales via _branch_performance_articles_v_blocks_section_items_locales_: rows/loop 2, loops 4, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items_children via _branch_performance_articles_v_blocks_section_items_children_pa: rows/loop 3, loops 4, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_blocks_section_items_children_lo via _branch_performance_articles_v_blocks_section_items_childr_1: rows/loop 2, loops 12, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_rels via _branch_performance_articles_v_rels_parent_idx: rows/loop 3, loops 20, removed by filter/loop unavailable.
- Index Scan _branch_performance_articles_v_locales via _branch_performance_articles_v_locales_parent_id_locale_uniq: rows/loop 2, loops 20, removed by filter/loop unavailable.

### relationship-predicate / branch-native

Calls: 1. Warm p50/p95: 4.478/5.064 ms. Returned/total: 20/100.

Statement 1 SHA-256: `516f4232005787f1ba960e357fa3597749f14daa44fe6ed117939573bb642b92`.

- Executed plan nodes: Sort, WindowAgg, Group, Nested Loop, Hash Join, Seq Scan, Hash, Bitmap Heap Scan, Bitmap Index Scan, Index Scan, Limit, CTE Scan, Aggregate.
- Root actual rows/loop: 20; loops: 1; execution ms: 2.744.
- Root inclusive buffers hit/read: 2982/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Seq Scan bq_e18a72f7b45959f9: rows/loop 10000, loops 1, removed by filter/loop 10000.
- Bitmap Heap Scan bq_e18a72f7b45959f9: rows/loop 200, loops 1, removed by filter/loop unavailable.
- Bitmap Index Scan via bq_e18a72f7b45959f9_ordinal_idx: rows/loop 200, loops 1, removed by filter/loop unavailable.
- Index Scan bq_e18a72f7b45959f9_rels via bq_e18a72f7b45959f9_rels_bq_e18a72f7b45959f9_id_idx: rows/loop 1, loops 100, removed by filter/loop 0.
- Index Scan bq_e18a72f7b45959f9 via bq_e18a72f7b45959f9_pkey: rows/loop 1, loops 131, removed by filter/loop 0.
- Index Scan bq_e18a72f7b45959f9 via bq_e18a72f7b45959f9_pkey: rows/loop 1, loops 131, removed by filter/loop 0.
- Index Scan bq_e18a72f7b45959f9 via bq_e18a72f7b45959f9_pkey: rows/loop 1, loops 131, removed by filter/loop 0.
- CTE Scan projection_all_ids: rows/loop 100, loops 1, removed by filter/loop unavailable.
- CTE Scan projection_all_ids: rows/loop 100, loops 1, removed by filter/loop unavailable.
- CTE Scan projection_selected_ids: rows/loop 20, loops 1, removed by filter/loop unavailable.
- Index Scan bq_e18a72f7b45959f9 via bq_e18a72f7b45959f9_pkey: rows/loop 1, loops 20, removed by filter/loop unavailable.
- Seq Scan bq_e18a72f7b45959f9_blocks_section: rows/loop 0, loops 20, removed by filter/loop 200.
- 26 scan nodes in complete plan; first 12 shown.

### relationship-predicate / published-native

Calls: 3. Warm p50/p95: 9.815/10.066 ms. Returned/total: 20/100.

Statement 1 SHA-256: `8190add3d8cfc95708388c86058b8911630e447833d2e4789ebd4f5f36d85f2d`.

- Executed plan nodes: Limit, Unique, Sort, Nested Loop, Hash Join, Seq Scan, Hash, Index Scan.
- Root actual rows/loop: 20; loops: 1; execution ms: 1.074.
- Root inclusive buffers hit/read: 520/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Seq Scan branch_performance_articles_rels: rows/loop 13100, loops 1, removed by filter/loop 0.
- Index Scan branch_performance_articles via branch_performance_articles_ordinal_idx: rows/loop 100, loops 1, removed by filter/loop unavailable.
- Index Scan branch_performance_articles via branch_performance_articles_pkey: rows/loop 1, loops 131, removed by filter/loop 0.

Statement 2 SHA-256: `8cbb4ce5a9cee9abe495e871b559fcc7a30ec35cd2858df65f4659152f4c761d`.

- Executed plan nodes: Limit, WindowAgg, Group, Nested Loop, Index Scan, Memoize.
- Root actual rows/loop: 1; loops: 1; execution ms: 7.528.
- Root inclusive buffers hit/read: 30558/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan branch_performance_articles_rels via branch_performance_articles_rels_parent_idx: rows/loop 13100, loops 1, removed by filter/loop 0.
- Index Scan branch_performance_articles via branch_performance_articles_pkey: rows/loop 0, loops 10000, removed by filter/loop 1.
- Index Scan branch_performance_articles via branch_performance_articles_pkey: rows/loop 1, loops 131, removed by filter/loop 0.

Statement 3 SHA-256: `cd4100c0d0a97af09463eb9e7e03b9f94def431dda92720d98cc328af85ea80d`.

- Executed plan nodes: Nested Loop, Index Scan, Aggregate, Sort, Seq Scan, Bitmap Heap Scan, Bitmap Index Scan.
- Root actual rows/loop: 20; loops: 1; execution ms: 0.324.
- Root inclusive buffers hit/read: 245/0; temp blocks read/written: 0/0.
- Rows below are per-loop native counters, not an additive rows-examined total.
- Index Scan branch_performance_articles via branch_performance_articles_pkey: rows/loop 20, loops 1, removed by filter/loop unavailable.
- Seq Scan branch_performance_articles_blocks_section: rows/loop 0, loops 20, removed by filter/loop 100.
- Seq Scan branch_performance_articles_blocks_section_locales: rows/loop 2, loops 1, removed by filter/loop 198.
- Bitmap Heap Scan branch_performance_articles_blocks_section_items: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Bitmap Index Scan via branch_performance_articles_blocks_section_items_parent_id_idx: rows/loop 4, loops 1, removed by filter/loop unavailable.
- Bitmap Heap Scan branch_performance_articles_blocks_section_items_locales: rows/loop 2, loops 4, removed by filter/loop unavailable.
- Bitmap Index Scan via branch_performance_articles_blocks_section_items_locales_par: rows/loop 2, loops 4, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_blocks_section_items_children via branch_performance_articles_blocks_section_items_children_paren: rows/loop 3, loops 4, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_blocks_section_items_children_local via branch_performance_articles_blocks_section_items_children_lo: rows/loop 2, loops 12, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_rels via branch_performance_articles_rels_parent_idx: rows/loop 3, loops 20, removed by filter/loop unavailable.
- Index Scan branch_performance_articles_locales via branch_performance_articles_locales_parent_id_locale_unique: rows/loop 2, loops 20, removed by filter/loop unavailable.

## sqlite-10000-2-1-0.01 — historical diagnostic; never final coverage

Report SHA-256: `49008deeafc4a9e40e94ee625e5a8c93ba60853b94ab55f44cc796a67648422f`. Implementation source SHA-256: `unavailable (predates source pinning)`. Node v24.15.0; darwin/arm64; database version not recorded in this historical report.

### range-page-and-total / current-drafts-native

Calls: 2. Warm p50/p95: 4.345/4.653 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `d1b10f9c36abdf5ef01df0768cb44b80e703d7b515aafbd67434d9b137324e46`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH _branch_performance_articles_v USING INDEX _branch_performance_articles_v_latest_idx (latest=?)

Statement 2 SHA-256: `59bc64cf4d1ae757b1eb8273365b71f30993d2625423de20fdd02ec17a136c06`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH _branch_performance_articles_v USING INDEX _branch_performance_articles_v_latest_idx (latest=?)
- CORRELATED SCALAR SUBQUERY 9
- CO-ROUTINE _branch_performance_articles_v__blocks_section
- SEARCH _branch_performance_articles_v__blocks_section USING INDEX _branch_performance_articles_v_blocks_section_parent_id_idx (_parent_id=?)
- USE TEMP B-TREE FOR ORDER BY
- SCAN _branch_performance_articles_v__blocks_section
- CORRELATED SCALAR SUBQUERY 1
- SEARCH _branch_performance_articles_v__blocks_section__locales USING INDEX _branch_performance_articles_v_blocks_section_locales_parent (_parent_id=?)
- CORRELATED SCALAR SUBQUERY 7
- CO-ROUTINE _branch_performance_articles_v__blocks_section_items
- SEARCH _branch_performance_articles_v__blocks_section_items USING INDEX _branch_performance_articles_v_blocks_section_items_parent_id_idx (_parent_id=?)
- SCAN _branch_performance_articles_v__blocks_section_items
- Plan has 30 entries; representative entries shown.

### range-page-and-total / branch-native

Calls: 1. Warm p50/p95: 49.983/50.668 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `359155c64aeae07db2611ad70780cb53cf63df566d2bc8f17d9737922c2376f6`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH bq_e18a72f7b45959f9 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1 (id=?)
- LIST SUBQUERY 19
- CO-ROUTINE projection_all_ids
- CO-ROUTINE (subquery-25)
- SCAN bq_e18a72f7b45959f9 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1
- CORRELATED SCALAR SUBQUERY 16
- SEARCH 80e48df4_082e_482c_b734_574d3019e401 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1 (id=?)
- USE TEMP B-TREE FOR ORDER BY
- SCAN (subquery-25)
- SCAN projection_all_ids
- SCALAR SUBQUERY 3
- CO-ROUTINE (subquery-26)
- Plan has 61 entries; representative entries shown.

### range-page-and-total / published-native

Calls: 2. Warm p50/p95: 0.984/1.008 ms. Returned/total: 20/5000.

Statement 1 SHA-256: `74fce6a5d9ff7e971b55d99543c3e5ece0d9c68f56869e5f6200f850a53606d4`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH branch_performance_articles USING COVERING INDEX branch_performance_articles_ordinal_idx (ordinal>?)

Statement 2 SHA-256: `561725e9ec94b0348d531bd949d4037c75a8b6394bb753d0d1f5a4a2228a39c4`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH branch_performance_articles USING INDEX branch_performance_articles_ordinal_idx (ordinal>?)
- CORRELATED SCALAR SUBQUERY 9
- CO-ROUTINE branch_performance_articles__blocks_section
- SEARCH branch_performance_articles__blocks_section USING INDEX branch_performance_articles_blocks_section_parent_id_idx (_parent_id=?)
- USE TEMP B-TREE FOR ORDER BY
- SCAN branch_performance_articles__blocks_section
- CORRELATED SCALAR SUBQUERY 1
- SEARCH branch_performance_articles__blocks_section__locales USING INDEX branch_performance_articles_blocks_section_locales_parent_id (_parent_id=?)
- CORRELATED SCALAR SUBQUERY 7
- CO-ROUTINE branch_performance_articles__blocks_section_items
- SEARCH branch_performance_articles__blocks_section_items USING INDEX branch_performance_articles_blocks_section_items_parent_id_idx (_parent_id=?)
- SCAN branch_performance_articles__blocks_section_items
- Plan has 30 entries; representative entries shown.

### relationship-predicate / current-drafts-native

Calls: 3. Warm p50/p95: 15.520/16.169 ms. Returned/total: 20/100.

Statement 1 SHA-256: `1e1293d1165dc5cf2c5ae2a37e546f25c63fccfec8260b3aad80cfdb95e75327`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH _branch_performance_articles_v USING INDEX _branch_performance_articles_v_latest_idx (latest=?)
- SEARCH 13685651_18ce_458f_b716_d065058f8783 USING INDEX _branch_performance_articles_v_rels_parent_idx (parent_id=?) LEFT-JOIN
- SEARCH ad5b9f2d_eaba_49af_8da0_4fd2d104a712 USING INDEX sqlite_autoindex_branch_performance_articles_1 (id=?)
- USE TEMP B-TREE FOR ORDER BY

Statement 2 SHA-256: `a32ab77bf3d877bf56d1a800268aed6d806487ef29e625181f78be51b00826c3`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- CO-ROUTINE (subquery-2)
- SEARCH _branch_performance_articles_v USING INDEX _branch_performance_articles_v_latest_idx (latest=?)
- SEARCH 13685651_18ce_458f_b716_d065058f8783 USING INDEX _branch_performance_articles_v_rels_parent_idx (parent_id=?) LEFT-JOIN
- SEARCH ad5b9f2d_eaba_49af_8da0_4fd2d104a712 USING INDEX sqlite_autoindex_branch_performance_articles_1 (id=?)
- SCAN (subquery-2)

Statement 3 SHA-256: `c8bc70aa54a74bf17e8fa90f24152aa2fc32b45db7e595211e25f647ab924816`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH _branch_performance_articles_v USING INTEGER PRIMARY KEY (rowid=?)
- CORRELATED SCALAR SUBQUERY 9
- CO-ROUTINE _branch_performance_articles_v__blocks_section
- SEARCH _branch_performance_articles_v__blocks_section USING INDEX _branch_performance_articles_v_blocks_section_parent_id_idx (_parent_id=?)
- USE TEMP B-TREE FOR ORDER BY
- SCAN _branch_performance_articles_v__blocks_section
- CORRELATED SCALAR SUBQUERY 1
- SEARCH _branch_performance_articles_v__blocks_section__locales USING INDEX _branch_performance_articles_v_blocks_section_locales_parent (_parent_id=?)
- CORRELATED SCALAR SUBQUERY 7
- CO-ROUTINE _branch_performance_articles_v__blocks_section_items
- SEARCH _branch_performance_articles_v__blocks_section_items USING INDEX _branch_performance_articles_v_blocks_section_items_parent_id_idx (_parent_id=?)
- SCAN _branch_performance_articles_v__blocks_section_items
- Plan has 29 entries; representative entries shown.

### relationship-predicate / branch-native

Calls: 1. Warm p50/p95: 151.974/161.539 ms. Returned/total: 20/100.

Statement 1 SHA-256: `3c475fb392c3b8de70be8cc037cee126d4cce6e441b5d1df90d1e27cdf2c5ec3`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH bq_e18a72f7b45959f9 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1 (id=?)
- LIST SUBQUERY 25
- CO-ROUTINE projection_all_ids
- CO-ROUTINE (subquery-34)
- SCAN bq_e18a72f7b45959f9 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1
- CORRELATED SCALAR SUBQUERY 22
- SEARCH c174235b_8b6e_4b8e_b689_08a5979806cb USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1 (id=?)
- SEARCH 3cf48924_e30b_4297_a427_5d0379b6c338 USING INDEX bq_e18a72f7b45959f9_rels_parent_idx (parent_id=?) LEFT-JOIN
- CORRELATED SCALAR SUBQUERY 19
- SEARCH 1d19f0ae_4a77_455c_864a_b211bb5e5eb4 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1 (id=?)
- CORRELATED SCALAR SUBQUERY 20
- SEARCH 12cfcaa3_20ad_4c41_a5b2_c1f25f396753 USING INDEX sqlite_autoindex_bq_e18a72f7b45959f9_1 (id=?)
- Plan has 85 entries; representative entries shown.

### relationship-predicate / published-native

Calls: 3. Warm p50/p95: 10.199/10.562 ms. Returned/total: 20/100.

Statement 1 SHA-256: `61af86154fdf34860989d1904299a65f47f2748ad041ccf4c73ad708f1b90180`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH branch_performance_articles USING INDEX branch_performance_articles_ordinal_idx (ordinal>?)
- SEARCH 82857fb1_19ea_4b96_a3b7_758c328bcf72 USING INDEX branch_performance_articles_rels_parent_idx (parent_id=?) LEFT-JOIN
- SEARCH 2c255570_d6ed_474e_bde6_a1da577a2ab6 USING INDEX sqlite_autoindex_branch_performance_articles_1 (id=?)
- USE TEMP B-TREE FOR DISTINCT
- USE TEMP B-TREE FOR RIGHT PART OF ORDER BY

Statement 2 SHA-256: `9429cfb836ea8f03ec586dbd842d3d1bccc0c37fcf0f36e3c1aa03167f0fd11d`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- CO-ROUTINE (subquery-2)
- SCAN branch_performance_articles USING INDEX sqlite_autoindex_branch_performance_articles_1
- SEARCH 82857fb1_19ea_4b96_a3b7_758c328bcf72 USING INDEX branch_performance_articles_rels_parent_idx (parent_id=?) LEFT-JOIN
- SEARCH 2c255570_d6ed_474e_bde6_a1da577a2ab6 USING INDEX sqlite_autoindex_branch_performance_articles_1 (id=?)
- SCAN (subquery-2)

Statement 3 SHA-256: `cecaa91dd4d41e664c8cb8954530d78b51864a9eb2145820aec6d606366c8b7a`.

- Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.
- SEARCH branch_performance_articles USING INDEX sqlite_autoindex_branch_performance_articles_1 (id=?)
- CORRELATED SCALAR SUBQUERY 9
- CO-ROUTINE branch_performance_articles__blocks_section
- SEARCH branch_performance_articles__blocks_section USING INDEX branch_performance_articles_blocks_section_parent_id_idx (_parent_id=?)
- USE TEMP B-TREE FOR ORDER BY
- SCAN branch_performance_articles__blocks_section
- CORRELATED SCALAR SUBQUERY 1
- SEARCH branch_performance_articles__blocks_section__locales USING INDEX branch_performance_articles_blocks_section_locales_parent_id (_parent_id=?)
- CORRELATED SCALAR SUBQUERY 7
- CO-ROUTINE branch_performance_articles__blocks_section_items
- SEARCH branch_performance_articles__blocks_section_items USING INDEX branch_performance_articles_blocks_section_items_parent_id_idx (_parent_id=?)
- SCAN branch_performance_articles__blocks_section_items
- Plan has 29 entries; representative entries shown.
