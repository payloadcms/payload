# Reporting an issue

To report an issue, please follow the steps below:

1. Fork this repository
2. Add necessary collections/globals/fields to the `test/_community` directory to recreate the issue you are experiencing
3. Create an issue and add a link to your forked repo

**The goal is to isolate the problem by reducing the number of fields/collections you add to the test/\_community folder. This folder is not meant for you to copy your project into, but to recreate the issue you are experiencing with minimal config.**

## Test directory file tree explanation

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
- `payload-types.ts` - Generated types from `config.ts`. Generate this file by running `pnpm dev:generate-types _community`.

The directory split up in this way specifically to reduce friction when creating tests and to add the ability to boot up Payload with that specific config. You should modify the files in `test/_community` to get started.

## How to start test collection admin UI

To start the admin panel so you can manually recreate your issue, you can run the following command:

```bash
# This command will start up Payload using your config
# NOTE: it will wipe the test database on restart
pnpm dev _community
```

## Testing is optional but encouraged

An issue does not need to have failing tests — reproduction steps with your forked repo are enough at this point. Some people like to dive deeper and we want to give you the guidance/tools to do so. Read more below.

### How to run integration tests (Payload API tests)

There are a couple ways to do this:

- **Granularly** - you can run individual tests in vscode by installing the Jest Runner plugin and using that to run individual tests. Clicking the `debug` button will run the test in debug mode allowing you to set break points.

  <img src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/assets/images/github/int-debug.png" />

- **Manually** - you can run all int tests in the `/test/_community/int.spec.ts` file by running the following command:

  ```bash
  pnpm test:int _community
  ```

### How to run E2E tests (Admin Panel UI tests)

The easiest way to run E2E tests is to install

- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Playwright Runner](https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni)

Once they are installed you can open the `testing` tab in vscode sidebar and drill down to the test you want to run, i.e. `/test/_community/e2e.spec.ts`

<img src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/assets/images/github/e2e-debug.png" />

#### Notes

- It is recommended to add the test credentials (located in `test/credentials.ts`) to your autofill for `localhost:3000/admin` as this will be required on every nodemon restart. The default credentials are `dev@payloadcms.com` as email and `test` as password.
