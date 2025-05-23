# Contributing to Payload

## Bugs, Feature Requests, and Q&As

- Bugs go in [GitHub Issues](https://github.com/payloadcms/payload/issues).
- Feature Requests in [GitHub Discussions](https://github.com/payloadcms/payload/discussions).
- Questions and Answers in [Discord](https://discord.com/invite/payload) or [GitHub Discussions](https://github.com/payloadcms/payload/discussions).

## Security issues & vulnerabilities

- DO NOT report it publicly. Contact us internally at [`dev@payloadcms.com`](mailto:dev@payloadcms.com)
- We are happy to reward vulnerabilities within the core repository if we determine they are significant.

## Documentation edits

- MDX files are in the `/docs` folder.
- If you want to preview the changes, see the instructions further down in this document.

## Installation & Requirements

The first time, you will need to run these terminal commands in the root directory of the monorepo:

- `corepack enable`. To install a compatible version of pnpm. Skip if you already have it.
- Node v18+ required. You can check your current node version by typing `node --version` in your terminal. The easiest way to switch between different node versions is to use [nvm](https://github.com/nvm-sh/nvm#intro).
- `pnpm install`. If you are coming from a very outdated version, it may be recommended that you run `pnpm clean:all` first.

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
- `int.spec.ts` - This is the test file run by jest. Any test file must have a `*int.spec.ts` suffix.
- `e2e.spec.ts` - This is the end-to-end test file that will load up the admin UI using the above config and run Playwright tests. These tests are typically only needed if a large change is being made to the Admin UI.
- `payload-types.ts` - Generated types from `config.ts`. Generate this file by running `pnpm dev:generate-types my-test-dir`. Replace `my-test-dir` with the name of your testing directory.

Each test directory is split up in this way specifically to reduce friction when creating tests and to add the ability to boot up Payload with that specific config.

The following command will start Payload with your config: `pnpm dev my-test-dir`. Example: `pnpm dev fields` for the test/`fields` test suite. This command will start up Payload using your config and refresh a test database on every restart. If you're using VS Code, the most common run configs are automatically added to your editor - you should be able to find them in your VS Code launch tab.

By default, payload will [automatically log you in](https://payloadcms.com/docs/authentication/overview#auto-login) with the default credentials. To disable that, you can either pass in the --no-auto-login flag (example: `pnpm dev my-test-dir --no-auto-login`) or set the `PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN` environment variable to `false`.

The default credentials are `dev@payloadcms.com` as E-Mail and `test` as password. These are used in the auto-login.

### Testing with your own MongoDB database

If you wish to use your own MongoDB database for the `test` directory instead of using the in memory database, all you need to do is add the following env vars to the `test/dev.ts` file:

- `process.env.NODE_ENV`
- `process.env.PAYLOAD_TEST_MONGO_URL`
- Simply set `process.env.NODE_ENV` to `test` and set `process.env.PAYLOAD_TEST_MONGO_URL` to your MongoDB URL e.g. `mongodb://127.0.0.1/your-test-db`.

### Using Postgres

If you have postgres installed on your system, you can also run the test suites using postgres. By default, mongodb is used.

To do that, simply set the `PAYLOAD_DATABASE` environment variable to `postgres`.

### Running the e2e and int tests

You can run the entire test suite using `pnpm test`. If you wish to only run e2e tests, you can use `pnpm test:e2e`. If you wish to only run int tests, you can use `pnpm test:int`.

By default, `pnpm test:int` will only run int test against MongoDB. To run int tests against postgres, you can use `pnpm test:int:postgres`. You will have to have postgres installed on your system for this to work.

### Pull Request Titles

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for our commit messages. Please follow this format when creating commits. Here are some examples:

- `feat: adds new feature`
- `fix: fixes bug`
- `docs: adds documentation`
- `chore: anything that is not a feature, fix, or docs`

If you are committing to [templates](./templates) or [examples](./examples), use the `chore` type with the proper scope, like this:

- `chore(templates): adds feature to template`
- `chore(examples): fixes bug in example`

## Previewing docs

This is how you can preview changes you made locally to the docs:

1. Clone our [website repository](https://github.com/payloadcms/website)
2. Run `pnpm install`
3. Duplicate the `.env.example` file and rename it to `.env`
4. Add a `DOCS_DIR` environment variable to the `.env` file which points to the absolute path of your modified docs folder. For example `DOCS_DIR=/Users/yourname/Documents/GitHub/payload/docs`
5. Run `pnpm fetchDocs:local`. If this was successful, you should see no error messages and the following output: _Docs successfully written to /.../website/src/app/docs.json_. There could be error messages if you have incorrect markdown in your local docs folder. In this case, it will tell you how you can fix it
6. You're done! Now you can start the website locally using `pnpm dev` and preview the docs under [http://localhost:3000/docs/local](http://localhost:3000/docs/local)

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
