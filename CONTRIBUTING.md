# Contributing to Payload

Below you'll find a set of guidelines for how to contribute to Payload.

## Opening issues

Before you submit an issue, please check all existing [open and closed issues](https://github.com/payloadcms/payload/issues) to see if your issue has previously been resolved or is already known. If there is already an issue logged, feel free to upvote it by adding a :thumbsup: [reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments). If you would like to submit a new issue, please fill out our Issue Template to the best of your ability so we can accurately understand your report.

## Security issues & vulnerabilities

If you come across an issue related to security, or a potential attack vector within Payload or one of its dependencies, please DO NOT create a publicly viewable issue. Instead, please contact us directly at [`dev@payloadcms.com`](mailto:dev@payloadcms.com). We will do everything we can to respond to the issue as soon as possible.

If you find a vulnerability within the core Payload repository, and we determine that it is remediable and of significant nature, we will be happy to pay you a reward for your findings and diligence. [`Contact us`](mailto:dev@payloadcms.com) to find out more.

## Documentation edits

Payload documentation can be found directly within its codebase, and you can feel free to make changes / improvements to any of it through opening a PR. We utilize these files directly in our website and will periodically deploy documentation updates as necessary.

## Building additional features

If you're an incredibly awesome person and want to help us make Payload even better through new features or additions, we would be thrilled to work with you.

## Design Contributions

When it comes to design-related changes or additions, it's crucial for us to ensure a cohesive user experience and alignment with our broader design vision. Before embarking on any implementation that would affect the design or UI/UX, we ask that you **first share your design proposal** with us for review and approval.

Our design review ensures that proposed changes fit seamlessly with other components, both existing and planned. This step is meant to prevent unintentional design inconsistencies and to save you from investing time in implementing features that might need significant design alterations later.

### Before Starting

To help us work on new features, you can create a new feature request post in [GitHub Discussion](https://github.com/payloadcms/payload/discussions) or discuss it in our [Discord](https://discord.com/invite/payload). New functionality often has large implications across the entire Payload repo, so it is best to discuss the architecture and approach before starting work on a pull request.

### Installation & Requirements

Payload is structured as a Monorepo, encompassing not only the core Payload platform but also various plugins and packages. To install all required dependencies, you have to run `pnpm install` once in the root directory. **PNPM IS REQUIRED!** Yarn or npm will not work - you will have to use pnpm to develop in the core repository. In most systems, the easiest way to install pnpm is to run `npm add -g pnpm` in your terminal.

If you're coming from a very outdated version of payload, it is recommended to perform a clean install, which nukes the node_modules folder and reinstalls all dependencies. You can easily do that using the `pnpm reinstall` command.

It is also recommended to use at least Node v23.11.0 or higher. You can check your current node version by typing `node --version` in your terminal. The easiest way to switch between different node versions is to use [nvm](https://github.com/nvm-sh/nvm#intro).

### Code

Most new functionality should keep testing in mind. All top-level directories within the `test/` directory are for testing a specific category: `fields`, `collections`, etc.

If it makes sense to add your feature to an existing test directory, please do so.

A typical directory with `test/` will be structured like this:

```text
.
├── config.ts
├── int.spec.ts
├── e2e.spec.ts
└── payload-types.ts
```

- `config.ts` - This is the _granular_ Payload config for testing. It should be as lightweight as possible. Reference existing configs for an example
- `int.spec.ts` - This is the test file run by vitest. Any test file must have a `*int.spec.ts` suffix.
- `e2e.spec.ts` - This is the end-to-end test file that will load up the admin UI using the above config and run Playwright tests. These tests are typically only needed if a large change is being made to the Admin UI.
- `payload-types.ts` - Generated types from `config.ts`. Generate this file by running `pnpm dev:generate-types my-test-dir`. Replace `my-test-dir` with the name of your testing directory.

Each test directory is split up in this way specifically to reduce friction when creating tests and to add the ability to boot up Payload with that specific config.

The following command will start Payload with your config: `pnpm dev my-test-dir`. Example: `pnpm dev fields` for the test/`fields` test suite. This command will start up Payload using your config and refresh a test database on every restart. If you're using VS Code, the most common run configs are automatically added to your editor - you should be able to find them in your VS Code launch tab.

By default, payload will [automatically log you in](https://payloadcms.com/docs/authentication/overview#auto-login) with the default credentials. To disable that, you can either pass in the --no-auto-login flag (example: `pnpm dev my-test-dir --no-auto-login`) or set the `PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN` environment variable to `false`.

The default credentials are `dev@payloadcms.com` as E-Mail and `test` as password. These are used in the auto-login.

### Database Setup

First, copy the `.env.example` file to your `.env`.

Set `PAYLOAD_DATABASE` in your `.env` file to choose the database adapter:

- `mongodb` - MongoDB Community with vector search (mongot)
- `mongodb-atlas` - MongoDB Atlas Local (all-in-one container)
- `cosmosdb` - MongoDB with compatibility options for Cosmos DB
- `documentdb` - MongoDB with compatibility options for Document DB
- `firestore` - MongoDB with compatibility options for Firestore
- `postgres` - PostgreSQL with pgvector and PostGIS
- `postgres-custom-schema` - PostgreSQL with custom schema
- `postgres-uuid` - PostgreSQL with UUID primary keys
- `postgres-read-replica` - PostgreSQL with read replica
- `sqlite` - SQLite
- `sqlite-uuid` - SQLite with UUID primary keys
- `supabase` - Supabase (PostgreSQL)
- `d1` - D1 (SQLite)

Then use Docker to start your database.

On MacOS, the easiest way to install Docker is to use brew. Simply run `pnpm install --cask docker`, open the docker desktop app, apply the recommended settings and you're good to go.

### PostgreSQL

```bash
pnpm docker:postgres:start         # Start (persists data)
pnpm docker:postgres:restart:clean # Start fresh (removes data)
pnpm docker:postgres:stop          # Stop
```

URL: `postgres://payload:payload@127.0.0.1:5433/payload`

### MongoDB (with vector search)

```bash
pnpm docker:mongodb:start          # Start (persists data)
pnpm docker:mongodb:restart:clean  # Start fresh (removes data)
pnpm docker:mongodb:stop           # Stop
```

URL: `mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0`

### MongoDB Atlas Local

```bash
pnpm docker:mongodb-atlas:start         # Start (persists data)
pnpm docker:mongodb-atlas:restart:clean # Start fresh (removes data)
pnpm docker:mongodb-atlas:stop          # Stop
```

URL: `mongodb://localhost:27019/payload?directConnection=true&replicaSet=mongodb-atlas-local` (no auth required)

### SQLite

SQLite databases don't require Docker - they're stored as files in the project.

### Testing with your own database

If you wish to use your own MongoDB database for the `test` directory instead of using the docker database, add the following to your `.env` file:

```env
MONGODB_URL=mongodb://127.0.0.1/payloadtests # Point this to your locally installed MongoDB database
POSTGRES_URL=postgres://127.0.0.1:5432/payloadtests # Point this to your locally installed PostgreSQL database
```

### Running the e2e and int tests

You can run the entire test suite using `pnpm test`. If you wish to only run e2e tests, you can use `pnpm test:e2e`. If you wish to only run int tests, you can use `pnpm test:int`.

By default, `pnpm test:int` will only run int test against MongoDB. To run int tests against postgres, you can use `pnpm test:int:postgres`. You will have to have postgres installed on your system for this to work.

### Pull Requests

For all Pull Requests, you should be extremely descriptive about both your problem and proposed solution. If there are any affected open or closed issues, please leave the issue number in your PR description.

All commits within a PR are squashed when merged, using the PR title as the commit message. For that reason, please use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for your PR titles.

Here are some examples:

- `feat: add new feature`
- `fix: fix bug`
- `docs: add documentation`
- `test: add/fix tests`
- `refactor: refactor code`
- `chore: anything that does not fit into the above categories`

If applicable, you must indicate the affected packages in parentheses to "scope" the changes. Changes to the payload chore package do not require scoping.

Here are some examples:

- `feat(ui): add new feature`
- `fix(richtext-lexical): fix bug`

If you are committing to [templates](./templates) or [examples](./examples), use the `chore` type with the proper scope, like this:

- `chore(templates): adds feature to template`
- `chore(examples): fixes bug in example`

## Previewing docs

This is how you can preview changes you made locally to the docs:

1. Clone our [website repository](https://github.com/payloadcms/website)
2. Run `pnpm install`
3. Follow the instructions in the [README of the website repository](https://github.com/payloadcms/website/blob/main/README.md#documentation) to preview the docs locally.

## Internationalization (i18n)

If your PR adds a string to the UI, we need to make sure to translate it into all the languages ​​that Payload supports. To do that:

- Find the appropriate internationalization file for your package. These are typically located in `packages/translations/src/languages`, although some packages (e.g., richtext-lexical) have separate i18n files for each feature.
- Add the string to the English locale "en".
- Translate it to other languages. You can use the `translateNewKeys` script if you have an OpenAI API key in your `.env` (under `OPENAI_KEY`), or you can use ChatGPT or Google translate - whatever is easier for you. For payload core translations (in packages/translations) you can run the `translateNewKeys` script using `cd packages/translations && pnpm translateNewKeys`. For lexical translations, you can run it using `cd packages/richtext-lexical && pnpm translateNewKeys`. External contributors can skip this step and leave it to us.

To display translation strings in the UI, make sure to use the `t` utility of the `useTranslation` hook:

```ts
const { t } = useTranslation()
// ...
t('yourStringKey')
```
