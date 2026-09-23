# MongoDB Schema Build Cache Benchmarks

**Written with AI**

## Decision

All measured acceptance checks pass. The initialization-scoped block-template cache is suitable for review. No additional production optimization is included. The main remaining allocation in the wide schema is the Mongoose discriminator clone required for each parent attachment. Disabling those clones would share more parent-specific mutable state, so this report does not recommend `clone: false`.

## Environment

- Before revision: `8ae761279a0ff5173a239d92c04c7b1bcc2c1640`
- After revision: `e61ce1807be1670c870dbbeca08bc39849734f5b`
- Attribution revision: `e61ce1807be1670c870dbbeca08bc39849734f5b`
- Node.js: v24.15.0
- Mongoose: 9.9.2
- Payload: 4.0.0-canary.14
- Platform: darwin 25.5.0 (arm64)
- Repetitions: 5
- Before data SHA-256: `8474489b81328b328cdf797d7ba2efffbc4044b4b349df5d6c5b04d461f518a7`
- After data SHA-256: `1534be241273fd5264048e22cc35275e0ac47e3111317053d918d04edf2be9dd`
- Attribution data SHA-256: `6b8e0e835d3660c7aa788c87f931252638d856cbbc82713fca8e0d8eafde8fc1`

Each memory sample ran in a fresh Node.js process with `--expose-gc` and an 8 GiB old-space limit. Values below are median with minimum–maximum in parentheses. RSS is supporting evidence because allocator behavior varies. Heap, constructor counts, and reachable compiled schemas are the primary evidence.

The draft scenario timing ranges each contain one extreme elapsed-time outlier. The raw values remain in the report. The decision uses the median and deterministic constructor counts, so those outliers do not affect the result.

## Results

| Scenario                 |                  Heap delta before |                Heap delta after |                      Init before |                   Init after |       Constructors before |     Constructors after |          Reachable before |        Reachable after | Incremental heap reduction |
| ------------------------ | ---------------------------------: | ------------------------------: | -------------------------------: | ---------------------------: | ------------------------: | ---------------------: | ------------------------: | ---------------------: | -------------------------: |
| minimal                  |          1.4 MiB (1.4 MiB–1.4 MiB) |       1.4 MiB (1.4 MiB–1.4 MiB) |                 9.2 ms (9.1–9.4) |            9.4 ms (9.2–10.3) |                   9 (9–9) |                9 (9–9) |                   9 (9–9) |                9 (9–9) |                         0% |
| wide-references          |    793.4 MiB (793.4 MiB–793.4 MiB) | 565.7 MiB (565.7 MiB–565.7 MiB) |     3,498.1 ms (3,469.6–3,530.4) | 2,285.8 ms (2,263.4–2,323.2) |    97,209 (97,209–97,209) | 49,289 (49,289–49,289) |    49,209 (49,209–49,209) | 49,209 (49,209–49,209) |                      28.8% |
| nested-diamond           | 3500.4 MiB (3499.3 MiB–3500.4 MiB) |       8.3 MiB (8.3 MiB–8.3 MiB) |      19,991 ms (19,668.1–20,667) |            51.7 ms (51–52.2) | 491,409 (491,409–491,409) |          457 (457–457) | 273,009 (273,009–273,009) |          409 (409–409) |                      99.8% |
| nested-diamond-drafts    | 3500.4 MiB (3499.3 MiB–3500.4 MiB) |       8.3 MiB (8.3 MiB–8.3 MiB) | 20,184.5 ms (20,066.8–319,464.6) |     55.3 ms (51.2–903,644.9) | 491,409 (491,409–491,409) |          457 (457–457) | 273,009 (273,009–273,009) |          409 (409–409) |                      99.8% |
| nested-diamond-localized | 4746.6 MiB (4746.4 MiB–4747.4 MiB) |    13.6 MiB (13.6 MiB–13.6 MiB) |  24,756.4 ms (24,020.2–25,297.4) |            89.3 ms (84–90.6) | 491,489 (491,489–491,489) |          785 (785–785) | 354,951 (354,951–354,951) |          639 (639–639) |                      99.7% |
| multiple-entities        | 1052.3 MiB (1052.3 MiB–1052.3 MiB) |       8.0 MiB (8.0 MiB–8.0 MiB) |     6,117.3 ms (5,985.3–6,128.6) |          50.2 ms (49.6–50.8) | 147,447 (147,447–147,447) |          459 (459–459) |    68,273 (68,273–68,273) |          273 (273–273) |                      99.4% |
| inline-control           |       69.0 MiB (68.9 MiB–69.0 MiB) |    69.3 MiB (69.3 MiB–69.3 MiB) |           326.2 ms (318.7–330.1) |       310.6 ms (308.9–339.7) |       8,209 (8,209–8,209) |    8,209 (8,209–8,209) |       4,209 (4,209–4,209) |    4,209 (4,209–4,209) |                      -0.5% |

The nested diamond scenarios receive the largest benefit because the same lower block graph was rebuilt for every route through the graph. The localized nested case also has two placement variants. The multiple-entity case benefits because the same definitions are reused across collections and globals in one initialization. The wide schema retains one discriminator attachment per block and field, so its reachable compiled schema count does not fall even though its temporary template work and heap use fall. The inline control uses separate block object identities and therefore has no cache hits by design.

## Absolute process memory after initialization

| Scenario                 |                         RSS before |                       RSS after |                   Heap used before |                 Heap used after |
| ------------------------ | ---------------------------------: | ------------------------------: | ---------------------------------: | ------------------------------: |
| minimal                  |    196.6 MiB (196.0 MiB–198.8 MiB) | 201.3 MiB (200.2 MiB–201.7 MiB) |       54.4 MiB (54.4 MiB–54.5 MiB) |    55.2 MiB (55.2 MiB–55.2 MiB) |
| wide-references          | 1153.4 MiB (1146.9 MiB–1154.8 MiB) | 935.6 MiB (928.5 MiB–955.6 MiB) |    847.3 MiB (847.3 MiB–847.3 MiB) | 620.2 MiB (620.2 MiB–620.2 MiB) |
| nested-diamond           | 4372.1 MiB (4300.4 MiB–4548.5 MiB) | 222.4 MiB (221.5 MiB–224.1 MiB) | 3553.5 MiB (3552.4 MiB–3553.5 MiB) |    62.2 MiB (62.2 MiB–62.2 MiB) |
| nested-diamond-drafts    | 4357.5 MiB (4321.3 MiB–4532.3 MiB) | 218.7 MiB (217.1 MiB–223.9 MiB) | 3553.5 MiB (3552.4 MiB–3553.6 MiB) |    62.2 MiB (62.2 MiB–62.2 MiB) |
| nested-diamond-localized | 5629.7 MiB (5497.3 MiB–5997.7 MiB) | 236.7 MiB (233.3 MiB–237.5 MiB) | 4799.8 MiB (4799.5 MiB–4800.5 MiB) |    67.4 MiB (67.4 MiB–67.4 MiB) |
| multiple-entities        | 1502.9 MiB (1500.9 MiB–1519.2 MiB) | 214.1 MiB (212.3 MiB–220.0 MiB) | 1105.4 MiB (1105.4 MiB–1105.4 MiB) |    61.9 MiB (61.9 MiB–61.9 MiB) |
| inline-control           |    336.3 MiB (335.3 MiB–339.1 MiB) | 339.0 MiB (337.9 MiB–340.5 MiB) |    126.9 MiB (126.9 MiB–127.0 MiB) | 128.0 MiB (128.0 MiB–128.0 MiB) |

## Heap above each revision's minimal scenario

| Scenario                 |     Before |     After | Reduction |
| ------------------------ | ---------: | --------: | --------: |
| minimal                  |    0.0 MiB |   0.0 MiB |        0% |
| wide-references          |  792.1 MiB | 564.3 MiB |     28.8% |
| nested-diamond           | 3499.0 MiB |   6.9 MiB |     99.8% |
| nested-diamond-drafts    | 3499.0 MiB |   6.9 MiB |     99.8% |
| nested-diamond-localized | 4745.3 MiB |  12.1 MiB |     99.7% |
| multiple-entities        | 1050.9 MiB |   6.6 MiB |     99.4% |
| inline-control           |   67.6 MiB |  67.9 MiB |     -0.5% |

## Acceptance checks

| Result | Check                                      | Evidence                                                                                          |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| PASS   | wide-references constructors               | 97.4% fewer non-clone constructors; 48,000 remaining calls are required discriminator attachments |
| PASS   | nested-diamond constructors                | 99.9% fewer constructors (491,409 to 457)                                                         |
| PASS   | wide-references incremental heap           | 28.8% lower incremental heap (830,546,528 to 591,684,368 bytes)                                   |
| PASS   | nested-diamond incremental heap            | 99.8% lower incremental heap (3,668,952,344 to 7,263,440 bytes)                                   |
| PASS   | nested-diamond-drafts incremental heap     | 99.8% lower incremental heap (3,668,967,832 to 7,261,680 bytes)                                   |
| PASS   | nested-diamond-localized incremental heap  | 99.7% lower incremental heap (4,975,766,448 to 12,739,368 bytes)                                  |
| PASS   | multiple-entities incremental heap         | 99.4% lower incremental heap (1,101,929,840 to 6,909,752 bytes)                                   |
| PASS   | inline-control incremental heap            | 0.5% change in incremental heap                                                                   |
| PASS   | inline-control initialization time         | -4.8% change in initialization time                                                               |
| PASS   | wide-references reachable schemas          | 49,209 before and 49,209 after                                                                    |
| PASS   | nested-diamond reachable schemas           | 273,009 before and 409 after                                                                      |
| PASS   | nested-diamond-drafts reachable schemas    | 273,009 before and 409 after                                                                      |
| PASS   | nested-diamond-localized reachable schemas | 354,951 before and 639 after                                                                      |
| PASS   | multiple-entities reachable schemas        | 68,273 before and 273 after                                                                       |
| PASS   | inline-control reachable schemas           | 4,209 before and 4,209 after                                                                      |

The wide constructor check uses the documented exception: non-clone constructor calls fall by more than 95%, while 48,000 remaining calls are Mongoose's required discriminator attachments. The inline control stays within the 5% guardrail for incremental heap and initialization time. Descriptor unit tests and the MongoDB integration suite cover schema structure, nested writes, localization, versions, number relationships, indexes, and reload isolation.

## Constructor allocation categories

The discriminator-clone counter overlaps the constructor stack categories. It identifies how many constructor calls came from Mongoose clone operations rather than adding another constructor count.

| Scenario                 | Category            |                    Before |                  After |
| ------------------------ | ------------------- | ------------------------: | ---------------------: |
| minimal                  | top-level           |                   7 (7–7) |                7 (7–7) |
| minimal                  | version             |                   0 (0–0) |                0 (0–0) |
| minimal                  | blocks-base         |                   0 (0–0) |                0 (0–0) |
| minimal                  | block-template      |                   0 (0–0) |                0 (0–0) |
| minimal                  | discriminator-clone |                   0 (0–0) |                0 (0–0) |
| minimal                  | array-group-tab     |                   2 (2–2) |                2 (2–2) |
| minimal                  | mongoose-internal   |                   0 (0–0) |                0 (0–0) |
| wide-references          | top-level           |                   7 (7–7) |                7 (7–7) |
| wide-references          | version             |                   0 (0–0) |                0 (0–0) |
| wide-references          | blocks-base         |    72,600 (72,600–72,600) | 48,640 (48,640–48,640) |
| wide-references          | block-template      |                   0 (0–0) |                0 (0–0) |
| wide-references          | discriminator-clone |    48,000 (48,000–48,000) | 48,000 (48,000–48,000) |
| wide-references          | array-group-tab     |    24,602 (24,602–24,602) |          642 (642–642) |
| wide-references          | mongoose-internal   |                   0 (0–0) |                0 (0–0) |
| nested-diamond           | top-level           |                   7 (7–7) |                7 (7–7) |
| nested-diamond           | version             |                   0 (0–0) |                0 (0–0) |
| nested-diamond           | blocks-base         | 491,300 (491,300–491,300) |          424 (424–424) |
| nested-diamond           | block-template      |                   0 (0–0) |                0 (0–0) |
| nested-diamond           | discriminator-clone | 218,400 (218,400–218,400) |          320 (320–320) |
| nested-diamond           | array-group-tab     |             102 (102–102) |             26 (26–26) |
| nested-diamond           | mongoose-internal   |                   0 (0–0) |                0 (0–0) |
| nested-diamond-drafts    | top-level           |                   7 (7–7) |                7 (7–7) |
| nested-diamond-drafts    | version             |                   0 (0–0) |                0 (0–0) |
| nested-diamond-drafts    | blocks-base         | 491,300 (491,300–491,300) |          424 (424–424) |
| nested-diamond-drafts    | block-template      |                   0 (0–0) |                0 (0–0) |
| nested-diamond-drafts    | discriminator-clone | 218,400 (218,400–218,400) |          320 (320–320) |
| nested-diamond-drafts    | array-group-tab     |             102 (102–102) |             26 (26–26) |
| nested-diamond-drafts    | mongoose-internal   |                   0 (0–0) |                0 (0–0) |
| nested-diamond-localized | top-level           |                   7 (7–7) |                7 (7–7) |
| nested-diamond-localized | version             |                   0 (0–0) |                0 (0–0) |
| nested-diamond-localized | blocks-base         | 491,380 (491,380–491,380) |          748 (748–748) |
| nested-diamond-localized | block-template      |                   0 (0–0) |                0 (0–0) |
| nested-diamond-localized | discriminator-clone | 218,480 (218,480–218,480) |          560 (560–560) |
| nested-diamond-localized | array-group-tab     |             102 (102–102) |             30 (30–30) |
| nested-diamond-localized | mongoose-internal   |                   0 (0–0) |                0 (0–0) |
| multiple-entities        | top-level           |                17 (17–17) |             17 (17–17) |
| multiple-entities        | version             |                   0 (0–0) |                0 (0–0) |
| multiple-entities        | blocks-base         | 147,390 (147,390–147,390) |          422 (422–422) |
| multiple-entities        | block-template      |                   0 (0–0) |                0 (0–0) |
| multiple-entities        | discriminator-clone |    65,522 (65,522–65,522) |          290 (290–290) |
| multiple-entities        | array-group-tab     |                37 (37–37) |             17 (17–17) |
| multiple-entities        | mongoose-internal   |                   3 (3–3) |                3 (3–3) |
| inline-control           | top-level           |                   7 (7–7) |                7 (7–7) |
| inline-control           | version             |                   0 (0–0) |                0 (0–0) |
| inline-control           | blocks-base         |       6,100 (6,100–6,100) |    6,100 (6,100–6,100) |
| inline-control           | block-template      |                   0 (0–0) |                0 (0–0) |
| inline-control           | discriminator-clone |       4,000 (4,000–4,000) |    4,000 (4,000–4,000) |
| inline-control           | array-group-tab     |       2,102 (2,102–2,102) |    2,102 (2,102–2,102) |
| inline-control           | mongoose-internal   |                   0 (0–0) |                0 (0–0) |

## Cache attribution totals

| Scenario                 |   Hits | Misses | Label/variant entries | Stored descriptors |
| ------------------------ | -----: | -----: | --------------------: | -----------------: |
| minimal                  |      0 |      0 |                     0 |                  0 |
| wide-references          | 47,920 |     80 |                    80 |                 80 |
| nested-diamond           |    272 |     48 |                    48 |                 48 |
| nested-diamond-drafts    |    272 |     48 |                    48 |                 48 |
| nested-diamond-localized |    384 |     96 |                    96 |                 96 |
| multiple-entities        |    216 |     72 |                    72 |                 72 |
| inline-control           |      0 |  4,000 |                    40 |              4,000 |

## Cache hits and misses by block and variant

Rows with the same variant and counts are grouped, but every block label is listed. Hits and misses are per listed block. Multiple misses for one label in the inline control represent separate block objects that intentionally share a slug but not an identity.

| Scenario                 | Variant             | Block labels        |            Hits per block |  Misses per block |
| ------------------------ | ------------------- | ------------------- | ------------------------: | ----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- |
| wide-references          | disableUnique:false | draftsEnabled:false | indexSortableFields:false | isLocalized:false | block:wide-block-0, block:wide-block-1, block:wide-block-10, block:wide-block-11, block:wide-block-12, block:wide-block-13, block:wide-block-14, block:wide-block-15, block:wide-block-16, block:wide-block-17, block:wide-block-18, block:wide-block-19, block:wide-block-2, block:wide-block-20, block:wide-block-21, block:wide-block-22, block:wide-block-23, block:wide-block-24, block:wide-block-25, block:wide-block-26, block:wide-block-27, block:wide-block-28, block:wide-block-29, block:wide-block-3, block:wide-block-30, block:wide-block-31, block:wide-block-32, block:wide-block-33, block:wide-block-34, block:wide-block-35, block:wide-block-36, block:wide-block-37, block:wide-block-38, block:wide-block-39, block:wide-block-4, block:wide-block-5, block:wide-block-6, block:wide-block-7, block:wide-block-8, block:wide-block-9 | 599 | 1   |
| wide-references          | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:wide-block-0, block:wide-block-1, block:wide-block-10, block:wide-block-11, block:wide-block-12, block:wide-block-13, block:wide-block-14, block:wide-block-15, block:wide-block-16, block:wide-block-17, block:wide-block-18, block:wide-block-19, block:wide-block-2, block:wide-block-20, block:wide-block-21, block:wide-block-22, block:wide-block-23, block:wide-block-24, block:wide-block-25, block:wide-block-26, block:wide-block-27, block:wide-block-28, block:wide-block-29, block:wide-block-3, block:wide-block-30, block:wide-block-31, block:wide-block-32, block:wide-block-33, block:wide-block-34, block:wide-block-35, block:wide-block-36, block:wide-block-37, block:wide-block-38, block:wide-block-39, block:wide-block-4, block:wide-block-5, block:wide-block-6, block:wide-block-7, block:wide-block-8, block:wide-block-9 | 599 | 1   |
| nested-diamond           | disableUnique:false | draftsEnabled:false | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 19  | 1   |
| nested-diamond           | disableUnique:false | draftsEnabled:false | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond           | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 19  | 1   |
| nested-diamond           | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond-drafts    | disableUnique:false | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 19  | 1   |
| nested-diamond-drafts    | disableUnique:false | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond-drafts    | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 19  | 1   |
| nested-diamond-drafts    | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond-localized | disableUnique:false | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 9   | 1   |
| nested-diamond-localized | disableUnique:false | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond-localized | disableUnique:false | draftsEnabled:true  | indexSortableFields:false |  isLocalized:true | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 9   | 1   |
| nested-diamond-localized | disableUnique:false | draftsEnabled:true  | indexSortableFields:false |  isLocalized:true | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond-localized | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 9   | 1   |
| nested-diamond-localized | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| nested-diamond-localized | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false |  isLocalized:true | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 9   | 1   |
| nested-diamond-localized | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false |  isLocalized:true | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| multiple-entities        | disableUnique:false | draftsEnabled:false | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 1   | 1   |
| multiple-entities        | disableUnique:false | draftsEnabled:false | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| multiple-entities        | disableUnique:false | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3, block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                       | 3   | 1   |
| multiple-entities        | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-0-0, block:diamond-0-1, block:diamond-0-2, block:diamond-0-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 5   | 1   |
| multiple-entities        | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:diamond-1-0, block:diamond-1-1, block:diamond-1-2, block:diamond-1-3, block:diamond-2-0, block:diamond-2-1, block:diamond-2-2, block:diamond-2-3, block:diamond-3-0, block:diamond-3-1, block:diamond-3-2, block:diamond-3-3, block:diamond-4-0, block:diamond-4-1, block:diamond-4-2, block:diamond-4-3, block:diamond-5-0, block:diamond-5-1, block:diamond-5-2, block:diamond-5-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 3   | 1   |
| inline-control           | disableUnique:false | draftsEnabled:false | indexSortableFields:false | isLocalized:false | block:inline-block-0, block:inline-block-1, block:inline-block-10, block:inline-block-11, block:inline-block-12, block:inline-block-13, block:inline-block-14, block:inline-block-15, block:inline-block-16, block:inline-block-17, block:inline-block-18, block:inline-block-19, block:inline-block-2, block:inline-block-3, block:inline-block-4, block:inline-block-5, block:inline-block-6, block:inline-block-7, block:inline-block-8, block:inline-block-9                                                                                                                                                                                                                                                                                                                                                                                             | 0   | 100 |
| inline-control           | disableUnique:true  | draftsEnabled:true  | indexSortableFields:false | isLocalized:false | block:inline-block-0, block:inline-block-1, block:inline-block-10, block:inline-block-11, block:inline-block-12, block:inline-block-13, block:inline-block-14, block:inline-block-15, block:inline-block-16, block:inline-block-17, block:inline-block-18, block:inline-block-19, block:inline-block-2, block:inline-block-3, block:inline-block-4, block:inline-block-5, block:inline-block-6, block:inline-block-7, block:inline-block-8, block:inline-block-9                                                                                                                                                                                                                                                                                                                                                                                             | 0   | 100 |

## Representative cached schema

This is a compact view of the stored template with the largest reachable schema graph in the nested diamond attribution run. The attribution JSON contains the complete descriptor.

```json
{
  "discriminatorCount": 212,
  "discriminatorSample": [
    "children_0_0:diamond-1-0",
    "children_0_0:diamond-1-1",
    "children_0_0:diamond-1-2",
    "children_0_0:diamond-1-3",
    "children_0_0<diamond-1-0>.children_1_0:diamond-2-0",
    "children_0_0<diamond-1-0>.children_1_0:diamond-2-1",
    "children_0_0<diamond-1-0>.children_1_0:diamond-2-2",
    "children_0_0<diamond-1-0>.children_1_0:diamond-2-3",
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0:diamond-3-0",
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0:diamond-3-1",
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0:diamond-3-2",
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0:diamond-3-3"
  ],
  "indexes": [],
  "label": "block:diamond-0-0",
  "options": {
    "_id": false,
    "id": false,
    "discriminatorKey": "__t",
    "minimize": true
  },
  "pathCount": 292,
  "pathSample": {
    "blockName": {
      "instance": "String"
    },
    "children_0_0": {
      "childPaths": ["blockType"],
      "instance": "Array"
    },
    "children_0_0.blockType": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.blockName": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.blockType": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.children_1_0": {
      "childPaths": ["blockType"],
      "instance": "Array"
    },
    "children_0_0<diamond-1-0>.children_1_0.blockType": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.blockName": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.blockType": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0": {
      "childPaths": ["blockType"],
      "instance": "Array"
    },
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0.blockType": {
      "instance": "String"
    },
    "children_0_0<diamond-1-0>.children_1_0<diamond-2-0>.children_2_0<diamond-3-0>.blockName": {
      "instance": "String"
    }
  },
  "reachableSchemaCount": 86,
  "variantKey": "disableUnique:false|draftsEnabled:false|indexSortableFields:false|isLocalized:false"
}
```

## Technical explanation

Before this change, every referenced block path built a new Mongoose schema and recursively rebuilt its child block schemas. A reused block graph therefore expanded once for every path through the graph. Mongoose then cloned each block schema again when it attached the discriminator to a parent. The recursive rebuilds caused the very large constructor counts, retained schema graphs, initialization time, and heap growth.

After this change, one schema-build context exists for one MongoDB adapter initialization. It stores each block template by the block object's identity and the four inputs that change its schema: unique-index handling, draft handling, sortable-index handling, and effective localization. Later references reuse the completed template. Mongoose still clones the template when it attaches a discriminator, which preserves independent top-level registrations. The context is passed through live collections, collection versions, globals, global versions, and all recursive field builders, then cleared in a `finally` block.

The context does not cross Payload instances or reloads. Inline blocks with different object identities do not share templates. Failed builds are not cached. The change does not alter MongoDB collection names, indexes, stored document shapes, Payload API response shapes, or generated types. Other database adapters and the Figma Content API do not use this Mongoose builder, so this optimization does not change their runtime behavior. The generic internal context can support a future adapter without exposing cache state through Payload's public API.

Mongoose's normal schema clone keeps some nested child-schema references. The memory reduction depends on reusing those immutable nested templates. Payload completes the nested discriminator graph before it stores a template and does not support post-initialization nested schema edits. The tests prove independent top-level registrations, stable complete descriptors, and a fresh context for reloads. Code that mutates a compiled nested discriminator after initialization remains outside this supported lifecycle.

## Further work

No additional optimization qualifies for this change. The wide schema still spends memory on required parent discriminator attachments, but removing Mongoose cloning would cross the schema ownership boundary and can share further mutable discriminator state. A future change would need a separate ownership design and a failing safety test before considering that option. Heap snapshots can also validate whether Mongoose path objects, rather than schema roots, are the largest remaining category in very wide schemas.
