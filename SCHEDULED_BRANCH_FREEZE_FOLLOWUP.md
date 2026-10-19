Written with AI

# Potential follow-up: freeze editorial work when scheduling a branch merge

Status: workflow proposal captured for later discussion. No freeze behavior is implemented or committed for this release.

## Why consider this

An editor may review a release, schedule it, and expect the approved content to remain unchanged until execution. Current scheduling instead queues future work against a mutable branch. This distinction should be explicit before deciding whether scheduled merges need an editorial freeze.

## Current behavior

- Scheduling stores a merge job, selected change IDs (if provided), the acting user, and the scheduled execution time.
- Scheduling does not put the branch in `merging` or block new content changes.
- Omitting `changes` selects all work pending when execution begins, including changes added after scheduling.
- Providing selected IDs merges the latest state of surviving matching pending changes, not their content as it existed when scheduled.
- Already merged/discarded change IDs are skipped. If none remain, no content is merged.
- The scheduling task currently converts `changes: []` to an omitted selection, selecting all pending work. Direct merge instead treats `[]` as selecting nothing.
- Execution reloads the user and repeats branch/content access, dependency, and validation checks. Missing users fail rather than receiving an access bypass.
- The normal merge lifecycle enters `merging` when execution starts. Content writes are blocked during that active merge. Target writes and source cleanup use the existing transaction/recovery behavior.

Related accepted correction: Q10 requires preserving `changes: []` as “select nothing” in both immediate and scheduled paths. That small consistency fix is separate from this proposed freeze workflow and remains pending implementation.

## Proposed workflow

Introduce an explicit `scheduled` state for a branch whose editorial work is frozen:

```text
open -> scheduled -> merging -> merged / closed
          |
       cancel
          |
         open
```

- Schedule: validate permissions and selection, queue the job, and freeze branch content as one coordinated operation.
- While scheduled: allow reads and review, but reject content changes through Admin, Local API, REST, and GraphQL paths.
- Cancel: cancel the pending job and return the branch to an editable state when no other active schedule requires the freeze.
- Revise: cancel, edit, review, and reschedule.
- Execute: transition the eligible scheduled branch into `merging`, then use normal merge checks and writes.
- Finish: preserve existing merged/closed semantics; pending work after a selected merge must be handled explicitly.

Freezing the whole branch is the initial recommendation for simplicity. It is not an approved scope decision; freezing only selected changes is another possible design.

## Reuse the blocking mechanism, not the active-merge status

`merging` means execution is underway. Using it throughout a potentially long scheduled wait would make status misleading and currently prevents execution: the merge-start guard expects an open branch before transitioning to merging.

An explicit scheduled state could share the writable-state checks with merging while keeping cancellation, permissions, UI wording, and transitions understandable. Extending the status alone is insufficient; execution eligibility and cancellation must be updated together.

## Product decisions still needed

1. Is freezing automatic for every scheduled merge, optional, or a separate release workflow?
2. Does it freeze the whole branch or selected changes only? How does a partial merge release the freeze on remaining work?
3. Can a branch have multiple schedules? Which schedule owns a freeze, and when is cancellation allowed to unfreeze it?
4. Are immediate merge, discard, branch deletion, or metadata edits allowed while scheduled, and what happens to the pending job?
5. After execution fails, does the branch stay frozen for review/retry or become editable? Define cancellation/retry explicitly rather than silently resuming edits.
6. Who may schedule, cancel, unfreeze, and reschedule, and which permissions are checked again at execution?
7. Does an empty selection create a no-op job or get rejected when scheduling? It must never be interpreted as all changes.
8. Do users need a content snapshot rather than an editorial freeze?

## A freeze is not a complete snapshot

Blocking branch edits stabilizes branch-owned editorial state, but untouched content still inherits current main. Relationships and dependencies may change; versions may be pruned; access, hooks, and database constraints may change before execution. Main may also receive intervening edits.

Continue execution-time checks. Do not promise frozen dependencies, immutable reviewed payloads, atomic visibility without transactions, or frozen external hook effects merely because a branch is scheduled.

## Engineering considerations

- Coordinate freeze and job creation so failure cannot leave a frozen branch without a job or a live job without the intended freeze.
- Guard schedule/cancel/start races, duplicate workers, stale jobs, and edits already in flight when scheduling occurs. Decide what content revision the freeze covers.
- Associate scheduled state with authoritative job ownership rather than a status flag alone.
- Enforce the freeze consistently across all content write paths, including versions/restores, globals, uploads, Trash, nested hooks, merge, and discard as appropriate to the product decisions.
- Preserve existing branch/document/field access checks and trusted internal execution paths.
- Update merge-start guards deliberately; do not bypass the lock by clearing status before execution without race protection.
- Explain the frozen state, cancellation path, and execution failures in Admin without presenting a future job as already running.
- Keep any failure-state redesign proportional to feedback; Q06/Q07 already defer broader failure/partial-state work.

## Verification for a future implementation

- Scheduling freezes the intended work; all relevant API write paths enforce it.
- Scheduling and editing concurrently cannot invalidate the promised review boundary.
- Cancellation restores editability only for the owning pending schedule and cannot unlock an active merge.
- Job creation/cancellation failures and duplicate execution leave recoverable, accurate state.
- Scheduled execution rechecks permissions and content, transitions into merging, and retains existing merge semantics.
- Empty selection remains empty, stale selections do not expand, and partial selections leave unselected work in a clearly defined state.
- Admin keyboard, focus, status announcements, and cancellation interactions are verified for the final UI.

## Implementation starting points

- `packages/ui/src/utilities/scheduleMergeHandler.ts`
- `packages/payload/src/branching/schedule/job.ts`
- `packages/payload/src/branching/assertBranchWritable.ts`
- `packages/payload/src/branching/merge/branchMergeStatus.ts`
- Branch collection status fields and scheduled-merge Admin views.
- `test/branching/scheduled-merge-access.int.spec.ts` and scheduling job/unit/e2e tests.

## Documentation alignment

The overview should describe current mutable scheduling until a freeze is implemented. Only then update the PR description, overview, lifecycle state table, API documentation, and generated types together. Do not describe `scheduled` as an existing status.

