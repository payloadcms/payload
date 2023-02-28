# Reporting an issue

To report an issue, please follow the steps below:

1. Fork this repository
2. Add collections/globals/fields to the `test/_community` directory to recreate the issue you are experiencing. The goal is to isolate the problem by reducing the number of fields/collections you add to the test/_community folder. This folder is not meant for you to copy your project into, but to recreate the issue you are experiencing with minimal config.

## Test directory file tree
```text
.
├── config.ts
├── int.spec.ts
├── e2e.spec.ts
└── payload-types.ts
```

- `config.ts` - This is the _granular_ Payload config for testing. It should be as lightweight as possible. Reference existing configs for an example
- `int.spec.ts` [Optional] - This is the test file run by jest. Any test file must have a `*int.spec.ts` suffix.
- `e2e.spec.ts` [Optional] - This is the end-to-end test file that will load up the admin UI using the above config and run Playwright tests.
- `payload-types.ts` - Generated types from `config.ts`. Generate this file by running `yarn dev:generate-types _community`.

The directory split up in this way specifically to reduce friction when creating tests and to add the ability to boot up Payload with that specific config.

## How to start up the admin UI
To start the admin panel so you can manually recreate your issue, you can run the following command:

  ```bash
  yarn dev _community
  ```

This command will start up Payload using your config and refresh a test database on every restart.


## How to run integration tests (Payload API tests)
There are a couple ways to do this:

- **Granularly** - you can run individual tests in vscode by installing the Jest Runner plugin and using that to run individual tests. Clicking the `debug` button will run the test in debug mode allowing you to set break points.

  <img src="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/github/int-debug.png" />

- **Manually** - you can run all int tests in the `/test/_community/int.spec.ts` file by running the following command:

  ```bash
  yarn test:int _community
  ```

## How to run E2E tests (Admin Panel UI tests)
The easiest way to run E2E tests is to install
- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Playwright Runner](https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni)

Once they are installed you can open the `testing` tab in vscode sidebar and drill down to the test you want to run, i.e. `/test/_community/e2e.spec.ts`

<img src="https://raw.githubusercontent.com/payloadcms/payload/master/src/admin/assets/images/github/e2e-debug.png" />


### Notes
- It is recommended to add the test credentials (located in `test/credentials.ts`) to your autofill for `localhost:3000/admin` as this will be required on every nodemon restart. The default credentials are `dev@payloadcms.com` as email and `test` as password.
