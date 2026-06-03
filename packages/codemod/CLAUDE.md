# @payloadcms/codemod — Claude Guidance

Package-scoped rules. See `README.md` for usage and the mechanical authoring recipe.

## Transform contract

- Transforms receive `{ project, packageJsons }`. The `TransformContext` does not expose `dry`, `print`, or any other flag. Never branch on options; the CLI controls persistence.
- Mutate only the `Project` and `packageJsons` you were handed. Do not read or write the filesystem directly, spawn processes, or touch state outside the provided context.
- Every transform must be idempotent. Running twice produces the same result as running once.
- Every transform must be safe on non-matching code. If the expected AST shape isn't there, return `{ filesChanged: [] }`. Do not throw for "didn't find what I expected".
- `filesChanged` must list exactly the files whose text changed. A transform that mutates a file but forgets to list it will silently under-report in the CLI summary.
- Use `notes` for surfacing information the user should see (e.g., spots that need manual review). Do not log via `console` from within a transform.
- Transforms may also receive `packageJsons` (an array of `{ path, data }`). Mutate `data` in place to edit a project's `package.json`; the CLI owns reading and writing the file. Do not read or write the filesystem directly from a transform.

## Testing discipline

- Every transform ships with a fixture-pair test: at least one `<case>.input.<ext>` / `<case>.output.<ext>` pair covering a real matching case (`.ts` for source transforms, `.json` for `package.json` transforms).
- Every transform ships with an idempotency test: running the transform on the fixture's output must produce the output unchanged.
- Every transform ships with at least one non-matching case proving the transform no-ops on unrelated code.
- Fixtures live as siblings of `index.ts`. Do not introduce `__fixtures__` subfolders.

## PR coupling

- A codemod lands in the **same PR** as the deprecation it migrates. Do not defer the codemod to a follow-up PR.
- Update the transform list in `README.md` in the same PR.

## Scope

- This package targets v3 → v4 migrations and v4-adoption transforms (e.g. opting projects into `payload build`). Do not add version metadata, `--since` flags, or back-catalog transforms for earlier versions.
- Future major versions (v4 → v5 and beyond) are a separate decision, not an extension to this package.
