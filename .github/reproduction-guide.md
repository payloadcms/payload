# Reproduction Guide

1. [Fork](https://github.com/payloadcms/payload/fork) this repo
2. Optionally, create a new branch for your reproduction
3. Run `pnpm install` to install dependencies
4. Open up the `test/_community` directory
5. Add any necessary `collections/globals/fields` in this directory to recreate the issue you are experiencing
6. Run `pnpm dev _community` to start the admin panel

**NOTE:** The goal is to isolate the problem by reducing the number of `collections/globals/fields` you add to the `test/_community` folder. This folder is _not_ meant for you to copy your project into, but rather recreate the issue you are experiencing with minimal config.

## Example test directory file tree

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

<br />

## Testing is optional but encouraged

An issue does not need to have failing tests — reproduction steps with your forked repo are enough at this point. Some people like to dive deeper and we want to give you the guidance/tools to do so. Read more below:

### Running integration tests (Payload API tests)

First install [Jest Runner for VSVode](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner).

There are a couple ways run integration tests:

- **Granularly** - you can run individual tests in vscode by installing the Jest Runner plugin and using that to run individual tests. Clicking the `debug` button will run the test in debug mode allowing you to set break points.

  <img src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/assets/images/github/int-debug.png" />

- **Manually** - you can run all int tests in the `/test/_community/int.spec.ts` file by running the following command:

  ```bash
  pnpm test:int _community
  ```

### Running E2E tests (Admin Panel UI tests)

The easiest way to run E2E tests is to install

- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Playwright Runner](https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni)

Once they are installed you can open the `testing` tab in vscode sidebar and drill down to the test you want to run, i.e. `/test/_community/e2e.spec.ts`

<img src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/assets/images/github/e2e-debug.png" />

#### Notes

The default credentials are `dev@payloadcms.com` as email and `test` as password. They can be found in `test/credentials.ts`. By default, these will be autofilled, so no log-in is required.
