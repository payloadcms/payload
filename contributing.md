# Contributing to Payload CMS

Below you'll find a set of guidelines for how to contribute to Payload CMS.

## Opening issues

Before you submit an issue, please check all existing [open and closed issues](https://github.com/payloadcms/payload/issues) to see if your issue has previously been resolved or is already known. If there is already an issue logged, feel free to upvote it by adding a :thumbsup: [reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments). If you would like to submit a new issue, please fill out our Issue Template to the best of your ability so we can accurately understand your report.

## Security issues & vulnerabilities

If you come across an issue related to security, or a potential attack vector within Payload or one of its dependencies, please DO NOT create a publicly viewable issue. Instead, please contact us directly at [`dev@payloadcms.com`](mailto:dev@payloadcms.com). We will do everything we can to respond to the issue as soon as possible.

If you find a vulnerability within the core Payload repository, and we determine that it is remediable and of significant nature, we will be happy to pay you a reward for your findings and diligence. [`Contact us`](mailto:dev@payloadcms.com) to find out more.

## Documentation edits

Payload documentation can be found directly within its codebase and you can feel free to make changes / improvements to any of it through opening a PR. We utilize these files directly in our website and will periodically deploy documentation updates as necessary.

## Building additional features

If you're an incredibly awesome person and want to help us make Payload even better through new features or additions, we would be thrilled to work with you.

### Before Starting

To help us work on new features, you can create a new feature request post in [GitHub Discussion](https://github.com/payloadcms/payload/discussions) or discuss it in our [Discord](https://discord.com/invite/r6sCXqVk3v). New functionality often has large implications across the entire Payload repo, so it is best to discuss the architecture and approach before starting work on a pull request.

### Code

Most new functionality should keep testing in mind. With 1.0, testability of new features has been vastly improved. All top-level directories within the `test/` directory are for testing a specific category: `fields`, `collections`, etc.

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
- `payload-types.ts` - Generated types from `config.ts`. Generate this file by running `yarn dev:generate-types my-test-dir`.

The directory split up in this way specifically to reduce friction when creating tests and to add the ability to boot up Payload with that specific config.

The following command will start Payload with your config: `yarn dev my-test-dir`. This command will start up Payload using your config and refresh a test database on every restart.

If you wish to use to your own Mongo database for the `test` directory instead of using the in memory database, all you need to do is add the following env vars to the `test/dev.ts` file:

- `process.env.NODE_ENV`
- `process.env.PAYLOAD_TEST_MONGO_URL`
- Simply set `process.env.NODE_ENV` to `test` and set `process.env.PAYLOAD_TEST_MONGO_URL` to your mongo url e.g. `mongodb://127.0.0.1/your-test-db`.

NOTE: It is recommended to add the test credentials (located in `test/credentials.ts`) to your autofill for `localhost:3000/admin` as this will be required on every nodemon restart. The default credentials are `dev@payloadcms.com` as E-Mail and `test` as password.

## Pull Requests

For all Pull Requests, you should be extremely descriptive about both your problem and proposed solution. If there are any affected open or closed issues, please leave the issue number in your PR message.
