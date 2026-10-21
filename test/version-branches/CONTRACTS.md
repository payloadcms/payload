Written with AI

# Legacy contracts before enabling branch heads

M0 characterizes behavior; it does not enable the head engine. Tests use the shared integration fixture with per-test reset and run against the current engine on SQLite, PostgreSQL, and MongoDB. The two genuine package source exports are documented in [fixtures/README.md](fixtures/README.md).

| Contract                                                                                                                                      | Executable evidence                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| New incomplete drafts retain logical identity; working updates leave the existing live materialization intact                                 | `legacy-contract.int.spec.ts`                                                              |
| Per-locale publication preserves sibling working translations; all-locale publication promotes the working view                               | `legacy-contract.int.spec.ts`                                                              |
| Locale withdrawal changes status while retaining content; incomplete drafts save but incomplete publication fails validation                  | `legacy-contract.int.spec.ts`                                                              |
| Repeated autosaves reuse their version identity and leave live content unchanged                                                              | `legacy-contract.int.spec.ts`                                                              |
| Collection restoration restores a selected historical version; explicit draft restoration leaves live content intact                          | `legacy-contract.int.spec.ts` (the stack includes the Local API draft-flag forwarding fix) |
| Global draft saves retain distinct live/working content; existing global Local restoration writes materialized storage                        | `legacy-contract.int.spec.ts`                                                              |
| Ordinary permissive reads can see unpublished anchors; published predicates and denied version/write access apply to Local and anonymous REST | `api-contract.int.spec.ts`                                                                 |
| Draft predicates apply before total counts, sort, and pagination; REST, GraphQL, and SDK expose working content when requested                | `api-contract.int.spec.ts`                                                                 |
| Collection locale schedules and all-locale global schedules publish the latest working content at execution                                   | `schedule-contract.int.spec.ts`                                                            |
| Bare scheduling actor IDs fail closed; typed scheduling actors execute with access and cannot run after the actor is deleted                  | `schedule-contract.int.spec.ts`                                                            |
| Legacy scheduled withdrawal changes status and copies newer working content into the inactive materialization                                 | `schedule-contract.int.spec.ts`                                                            |

The full existing `test/versions/int.spec.ts` remains the broader regression baseline: create/read/update versions, default status, draft validation, locale handling, history limits, restore and field/collection access, REST/GraphQL autosave, and scheduling user identity. `test/localization/int.spec.ts` and `test/localization/localizeStatus.int.spec.ts` provide additional locale/status and scalar-to-localized migration coverage. These suites are existing evidence, not replacements for the later branch-engine operation and migration tests.

The following are deliberate changes for later milestones and must not be hidden as compatibility behavior:

- A merge into `main` publishes the selected scopes. Working branch names do not create nested writable draft/published states.
- Current global Local restoration has no draft option and writes the materialized global. M4 must add working-only restoration consistently with collections.
- Current scheduled withdrawal can copy newer working content into the inactive live row. M4/M7 must withdraw availability without copying newer working content into main.
- Legacy pending publication selects latest content at execution. Migration must retain that policy explicitly; newly created frozen schedules must not silently adopt it.
- Current autosave mutates a reusable version. M2/M4 must freeze or copy-on-write versions before heads, schedules, history, or receipts rely on them.
- Existing permissive read access can expose draft anchors. Branch identity visibility must preserve access guarantees while preventing a new named-branch-only document from leaking into other branches.

All-locale withdrawal is a required new branch operation. Its behavior cannot be inferred from the old job input's absent locale: the existing handler only sets `publishAllLocales` for publication. M5/M7 must implement and test explicit all-locale withdrawal. Browser/editor behavior and accessibility remain M10 gates.
