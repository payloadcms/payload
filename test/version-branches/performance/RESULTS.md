Written with AI

# Settled-source native performance matrix

Source SHA-256: `abffd4f63a62df57873c9f7e24c30abf96b292bd076c6425b691a4fa9f3ba2fa` (1427 source files; implementation and benchmark). This digest includes new and uncommitted source, not generated results. Only explicit final evidence with this exact digest, unchanged throughout each scenario, contributes to this table. Historical diagnostics are described in [PERFORMANCE.md](../PERFORMANCE.md).

Coverage: **0/48 passed, 0 failed, 48 missing**. Both p50 and p95 must remain at most 2x the equivalent existing native draft workload. A scenario also requires full content/owned-locale parity, authoritative native hydration samples, the depth-two graph with cycles/denied targets, caller-transaction graph validation, and measured fanout maintenance verified on every branch. No exception is approved.

No final environment has been measured for this source digest.

Raw JSON, native plans, individual samples, logs, and matrix manifests: `/private/tmp/payload-branch-performance/final/abffd4f63a62df57873c9f7e24c30abf96b292bd076c6425b691a4fa9f3ba2fa`. Reproduce with `PAYLOAD_BRANCH_PERF_EVIDENCE=final` and the documented dedicated database commands. Matrix runners pin the starting digest automatically and reject source changes.

Reviewable representative native plans and scan counters are retained in [NATIVE-PLANS.md](./NATIVE-PLANS.md); historical diagnostic entries there never contribute to this coverage table.

Percentile columns show p50/p95 ratios. Calls show selective core/graph native commands. Storage is allocated database MiB (Mongo adds reported index bytes); peak RSS is worker MiB including setup. Write rows show ordinary/heavy acknowledged native SQL rows or Mongo documents, each for one logical main-head change, with the limitations documented in PERFORMANCE.md.

| Adapter  | Documents | Override density | Locales | Working branches | Status  | Worst scalar ratios | Graph ratios | Calls core/graph | Seed seconds | Storage MiB | Peak RSS MiB | Write rows |
| -------- | --------: | ---------------: | ------: | ---------------: | ------- | ------------------: | -----------: | ---------------: | -----------: | ----------: | -----------: | ---------: |
| mongodb  |     10000 |             0.01 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |              0.8 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |             0.01 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |              0.8 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |             0.01 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |              0.8 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |             0.01 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |     10000 |              0.8 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |             0.01 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |              0.8 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |             0.01 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |              0.8 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |             0.01 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |              0.8 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |             0.01 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| mongodb  |    100000 |              0.8 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |             0.01 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |              0.8 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |             0.01 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |              0.8 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |             0.01 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |              0.8 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |             0.01 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |     10000 |              0.8 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |             0.01 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |              0.8 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |             0.01 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |              0.8 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |             0.01 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |              0.8 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |             0.01 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| postgres |    100000 |              0.8 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |             0.01 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |              0.8 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |             0.01 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |              0.8 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |             0.01 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |              0.8 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |             0.01 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |     10000 |              0.8 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |             0.01 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |              0.8 |       2 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |             0.01 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |              0.8 |       2 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |             0.01 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |              0.8 |      10 |                1 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |             0.01 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |
| sqlite   |    100000 |              0.8 |      10 |               20 | MISSING |                 —/— |          —/— |              —/— |            — |           — |            — |        —/— |

No final per-workload percentile evidence is available for this source digest.
