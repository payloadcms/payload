STATUS: DONE
Commits made: 80997a33ae (fix: draft all locales for shared global draft changes)
Test summary: `pnpm run test:int test/localization/int.spec.ts -t "should mark all locales as draft when a global draft save changes a non-localized field"` and `pnpm run test:int test/localization/int.spec.ts -t "should publish and unpublish all"` passed.
Concerns: Unrelated pre-existing edits remain in `packages/payload/src/utilities/mergeLocalizedData.ts`, `packages/payload/src/versions/drafts/replaceWithDraftIfAvailable.ts`, and `docs/superpowers/`; they were left untouched.

---

STATUS: DONE
Commits made: pending
Test summary: `pnpm run test:int test/localization/int.spec.ts -t "should keep published locales published when a global draft save changes only localized fields"` passed; `pnpm run test:int test/localization/int.spec.ts -t "should mark all locales as draft when a global draft save changes a non-localized field"` passed.
Concerns: Unrelated pre-existing edits remain in `packages/payload/src/utilities/mergeLocalizedData.ts`, `packages/payload/src/versions/drafts/replaceWithDraftIfAvailable.ts`, and `docs/superpowers/`; they were left untouched.
