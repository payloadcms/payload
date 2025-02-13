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

Payload is structured as a Monorepo, encompassing not only the core Payload platform but also various plugins and packages. To install all required dependencies, you have to run `pnpm install` once in the root directory. **PNPM IS REQUIRED!** Yarn or npm will not work - you will have to use pnpm to develop in the core repository. In most systems, the easiest way to install pnpm is to run `corepack enable` in your terminal.

If you're coming from a very outdated version of payload, it is recommended to nuke the node_modules folder before running pnpm install. On UNIX systems, you can easily do that using the `pnpm clean:unix` command, which will delete all node_modules folders and build artefacts.

It is also recommended to use at least Node v18 or higher. You can check your current node version by typing `node --version` in your terminal. The easiest way to switch between different node versions is to use [nvm](https://github.com/nvm-sh/nvm#intro).

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

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for our commit messages. Please follow this format when creating commits. Here are some examples:

- `feat: adds new feature`
- `fix: fixes bug`
- `docs: adds documentation`
- `chore: does chore`

Here's a breakdown of the format. At the top-level, we use the following types to categorize our commits:

- `feat`: new feature that adds functionality. These are automatically added to the changelog when creating new releases.
- `fix`: a fix to an existing feature. These are automatically added to the changelog when creating new releases.
- `docs`: changes to [docs](./docs) only. These do not appear in the changelog.
- `chore`: changes to code that is neither a fix nor a feature (e.g. refactoring, adding tests, etc.). These do not appear in the changelog.

If you are committing to [templates](./templates) or [examples](./examples), use the `chore` type with the proper scope, like this:

- `chore(templates): adds feature to template`
- `chore(examples): fixes bug in example`

## Pull Requests

For all Pull Requests, you should be extremely descriptive about both your problem and proposed solution. If there are any affected open or closed issues, please leave the issue number in your PR message.

## Previewing docs

This is how you can preview changes you made locally to the docs:

1. Clone our [website repository](https://github.com/payloadcms/website)
2. Run `yarn install`
3. Duplicate the `.env.example` file and rename it to `.env`
4. Add a `DOCS_DIR` environment variable to the `.env` file which points to the absolute path of your modified docs folder. For example `DOCS_DIR=/Users/yourname/Documents/GitHub/payload/docs`
5. Run `yarn run fetchDocs:local`. If this was successful, you should see no error messages and the following output: _Docs successfully written to /.../website/src/app/docs.json_. There could be error messages if you have incorrect markdown in your local docs folder. In this case, it will tell you how you can fix it
6. You're done! Now you can start the website locally using `yarn run dev` and preview the docs under [http://localhost:3000/docs/](http://localhost:3000/docs/)

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
