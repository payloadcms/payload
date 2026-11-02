# Assessing new UI changes

## Scope the journey

Start from the feature, paths or comparison. Inspect staged, unstaged and relevant untracked files for local work; report the actual base for a branch/PR. Exclude unrelated local changes.

Read relevant implementation, styles, config, labels and tests. Trace shared controls, hooks, providers and portals; check representative consumers, including nested drawers/mobile where relevant. CSS-only changes can affect clipping, contrast, focus and target geometry.

Without a diff, start from the intended journey and revisit once implemented. If accessible behavior is unaffected, explain briefly and skip browser checks.

## Define expectations

Select relevant states: initial, open/closed, loading, empty, error, success, selected, disabled/read-only and permissions. Include input methods, themes, narrow layouts, text resizing and spacing as affected; do not require every combination.

Read the full A/AA reference and connect:

**Action/state → accessible outcome → criterion → evidence.**

W3C success criteria are normative; Understanding documents, techniques and ARIA patterns guide interpretation/implementation. Respect exceptions; do not treat AAA criteria or recommended techniques as AA requirements.

Example: an async picker in a drawer needs a name, keyboard selection, loading/error/results feedback and sensible focus on opening, dismissal and return. Consider 1.3.1, 2.1.1–2, 2.4.3/7/11, 3.3.1 and 4.1.2–3 as applicable. Test inside the drawer. Add live regions only for updates that need them, checking whether they qualify as status messages.

## Verify proportionally

Use an isolated test environment and disposable data; never reset a shared or developer database. Track and clean up assessment-created data, files and temporary settings, preserving unrelated work. Report anything left for review and clean it up when no longer needed.

Reuse assertions covering the same state, interaction and observable outcome against the current implementation. Matching test names, ARIA attributes or axe scans alone may be insufficient.

Follow `testing.md`: browser tests for names, roles, states, keyboard and geometry; axe for machine-detectable failures; Guidepup for speech/cursor outcomes. New-feature tests assert expected accessible behavior; an absent feature is not an accessibility failure.

Within authorised implementation, reproduce confirmed barriers, fix and recheck. Separate unrelated pre-existing findings. Cover affected shared consumers without running unrelated suites. Follow repository production-test requirements for client/server bundling changes.

If browser/AT access is unavailable, continue source assessment and specify pending interactions and expected outcomes. Do not automatically change machine permissions or use DOM assertions as speech evidence.

## Classify evidence

- **Confirmed finding:** demonstrated barrier and user impact.
- **Suspected risk:** source/design concern needing verification.
- **Coverage gap:** missing evidence, without a demonstrated failure.
- **Verified outcome:** a check ran and supports the outcome in the assessed state.

Use the skill's handoff format. Source alone cannot verify rendered contrast, clipping, focus movement or speech. Explain irrelevant criteria only when useful; small changes do not need a full conformance checklist.
