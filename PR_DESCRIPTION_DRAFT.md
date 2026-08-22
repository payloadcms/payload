# fix(types): support object-form localization.locales in schema generation (#17858)

## Summary
Resolves #17858 by properly extracting locale codes from object-form `localization.locales` (`{ label, value }` / `{ label, code }`) in `generateLocaleEntitySchemas` and `generateFallbackLocaleEntitySchemas`, preventing `undefined` enum entries and TypeError crashes in `json-schema-to-typescript` during `generate:types`.

Closes #17858

## Validation

- `pnpm exec vitest run packages/payload/src/utilities/configToJSONSchema.spec.ts --project unit` — 17/17 passed
- `pnpm build:translations` — passed
- `pnpm exec tsc --noEmit -p packages/payload/tsconfig.json` — passed
- Prettier and focused ESLint — passed (only pre-existing warnings in the spec)

Suggested remote title: `fix(cpa): support object-form localization.locales in schema generation (#17858)`
