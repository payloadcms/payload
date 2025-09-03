# Payload Monorepo Agent Instructions

## Project Structure

- Packages are located in the `packages/` directory.
  - The main Payload package is `packages/payload`. This contains the core functionality.
  - Database adapters are in `packages/db-*`.
  - The UI package is `packages/ui`.
  - The Next.js integration is in `packages/next`.
  - Rich text editor packages are in `packages/richtext-*`.
  - Storage adapters are in `packages/storage-*`.
  - Email adapters are in `packages/email-*`.
  - Plugins which add additional functionality are in `packages/plugin-*`.
- Documentation is in the `docs/` directory.
- Monorepo tooling is in the `tools/` directory.
- Test suites and configs are in the `test/` directory.
- LLMS.txt is at URL: https://payloadcms.com/llms.txt
- LLMS-FULL.txt is at URL: https://payloadcms.com/llms-full.txt

## Dev environment tips

- Any package can be built using a `pnpm build:*` script defined in the root `package.json`. These typically follow the format `pnpm build:<directory_name>`. The options are all of the top-level directories inside the `packages/` directory. Ex `pnpm build:db-mongodb` which builds the `packages/db-mongodb` package.
- ALL packages can be built with `pnpm build:all`.
- Use `pnpm dev` to start the monorepo dev server. This loads the default config located at `test/_common/config.ts`.
- Specific dev configs for each package can be run with `pnpm dev <directory_name>`. The options are all of the top-level directories inside the `test/` directory. Ex `pnpm dev fields` which loads the `test/fields/config.ts` config. The directory name can either encompass a single area of functionality or be the name of a specific package.

## Testing instructions

- There are unit, integration, and e2e tests in the monorepo.
- Unit tests can be run with `pnpm test:unit`.
- Integration tests can be run with `pnpm test:int`. Individual test suites can be run with `pnpm test:int <directory_name>`, which will point at `test/<directory_name>/int.spec.ts`.
- E2E tests can be run with `pnpm test:e2e`.
- All tests can be run with `pnpm test`.
- Prefer running `pnpm test:int` for verifying local code changes.

## PR Guidelines

- This repository follows conventional commits for PR titles
- PR Title format: <type>(<scope>): <title>. Title must start with a lowercase letter.
- Valid types are build, chore, ci, docs, examples, feat, fix, perf, refactor, revert, style, templates, test
- Prefer `feat` for new features and `fix` for bug fixes.
- Valid scopes are the following regex patterns: cpa, db-\*, db-mongodb, db-postgres, db-vercel-postgres, db-sqlite, drizzle, email-\*, email-nodemailer, email-resend, eslint, graphql, live-preview, live-preview-react, next, payload-cloud, plugin-cloud, plugin-cloud-storage, plugin-form-builder, plugin-import-export, plugin-multi-tenant, plugin-nested-docs, plugin-redirects, plugin-search, plugin-sentry, plugin-seo, plugin-stripe, richtext-\*, richtext-lexical, richtext-slate, storage-\*, storage-azure, storage-gcs, storage-uploadthing, storage-vercel-blob, storage-s3, translations, ui, templates, examples(\/(\w|-)+)?, deps
- Scopes should be chosen based upon the package(s) being modified. If multiple packages are being modified, choose the most relevant one or no scope at all.
- Example PR titles:
  - `feat(db-mongodb): add support for transactions`
  - `feat(richtext-lexical): add options to hide block handles`
  - `fix(ui): json field type ignoring editorOptions`

## Commit Guidelines

- This repository follows conventional commits for commit messages
- The first commit of a branch should follow the PR title format: <type>(<scope>): <title>. Follow the same rules as PR titles.
- Subsequent commits should prefer `chore` commits without a scope unless a specific package is being modified.
- These will eventually be squashed into the first commit when merging the PR.
