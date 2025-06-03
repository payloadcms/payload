# Payload Plugin Template

A template repo to create a [Payload CMS](https://payloadcms.com) plugin.

Payload is built with a robust infrastructure intended to support Plugins with ease. This provides a simple, modular, and reusable way for developers to extend the core capabilities of Payload.

To build your own Payload plugin, all you need is:

- An understanding of the basic Payload concepts
- And some JavaScript/Typescript experience

## Background

Here is a short recap on how to integrate plugins with Payload, to learn more visit the [plugin overview page](https://payloadcms.com/docs/plugins/overview).

### How to install a plugin

To install any plugin, simply add it to your payload.config() in the Plugin array.

```ts
import myPlugin from 'my-plugin'

export const config = buildConfig({
  plugins: [
    // You can pass options to the plugin
    myPlugin({
      enabled: true,
    }),
  ],
})
```

### Initialization

The initialization process goes in the following order:

1. Incoming config is validated
2. **Plugins execute**
3. Default options are integrated
4. Sanitization cleans and validates data
5. Final config gets initialized

## Building the Plugin

When you build a plugin, you are purely building a feature for your project and then abstracting it outside of the project.

### Template Files

In the Payload [plugin template](https://github.com/payloadcms/payload/tree/main/templates/plugin), you will see a common file structure that is used across all plugins:

1. root folder
2. /src folder
3. /dev folder

#### Root

In the root folder, you will see various files that relate to the configuration of the plugin. We set up our environment in a similar manner in Payload core and across other projects, so hopefully these will look familiar:

- **README**.md\* - This contains instructions on how to use the template. When you are ready, update this to contain instructions on how to use your Plugin.
- **package**.json\* - Contains necessary scripts and dependencies. Overwrite the metadata in this file to describe your Plugin.
- .**eslint**.config.js - Eslint configuration for reporting on problematic patterns.
- .**gitignore** - List specific untracked files to omit from Git.
- .**prettierrc**.json - Configuration for Prettier code formatting.
- **tsconfig**.json - Configures the compiler options for TypeScript
- .**swcrc** - Configuration for SWC, a fast compiler that transpiles and bundles TypeScript.
- **vitest**.config.js - Config file for Vitest, defining how tests are run and how modules are resolved

**IMPORTANT\***: You will need to modify these files.

#### Dev

In the dev folder, you’ll find a basic payload project, created with `npx create-payload-app` and the blank template.

**IMPORTANT**: Make a copy of the `.env.example` file and rename it to `.env`. Update the `DATABASE_URI` to match the database you are using and your plugin name. Update `PAYLOAD_SECRET` to a unique string.
**You will not be able to run `pnpm/yarn dev` until you have created this `.env` file.**

`myPlugin` has already been added to the `payload.config()` file in this project.

```ts
plugins: [
  myPlugin({
    collections: {
      posts: true,
    },
  }),
]
```

Later when you rename the plugin or add additional options, **make sure to update it here**.

You may wish to add collections or expand the test project depending on the purpose of your plugin. Just make sure to keep this dev environment as simplified as possible - users should be able to install your plugin without additional configuration required.

When you’re ready to start development, initiate the project with `pnpm/npm/yarn dev` and pull up [http://localhost:3000](http://localhost:3000) in your browser.

#### Src

Now that we have our environment setup and we have a dev project ready to - it’s time to build the plugin!

**index.ts**

The essence of a Payload plugin is simply to extend the payload config - and that is exactly what we are doing in this file.

```ts
export const myPlugin =
  (pluginOptions: MyPluginConfig) =>
  (config: Config): Config => {
    // do cool stuff with the config here

    return config
  }
```

First, we receive the existing payload config along with any plugin options.

From here, you can extend the config as you wish.

Finally, you return the config and that is it!

##### Spread Syntax

Spread syntax (or the spread operator) is a feature in JavaScript that uses the dot notation **(...)** to spread elements from arrays, strings, or objects into various contexts.

We are going to use spread syntax to allow us to add data to existing arrays without losing the existing data. It is crucial to spread the existing data correctly – else this can cause adverse behavior and conflicts with Payload config and other plugins.

Let’s say you want to build a plugin that adds a new collection:

```ts
config.collections = [
  ...(config.collections || []),
  // Add additional collections here
]
```

First we spread the `config.collections` to ensure that we don’t lose the existing collections, then you can add any additional collections just as you would in a regular payload config.

This same logic is applied to other properties like admin, hooks, globals:

```ts
config.globals = [
  ...(config.globals || []),
  // Add additional globals here
]

config.hooks = {
  ...(incomingConfig.hooks || {}),
  // Add additional hooks here
}
```

Some properties will be slightly different to extend, for instance the onInit property:

```ts
import { onInitExtension } from './onInitExtension' // example file

config.onInit = async (payload) => {
  if (incomingConfig.onInit) await incomingConfig.onInit(payload)
  // Add additional onInit code by defining an onInitExtension function
  onInitExtension(pluginOptions, payload)
}
```

If you wish to add to the onInit, you must include the **async/await**. We don’t use spread syntax in this case, instead you must await the existing `onInit` before running additional functionality.

In the template, we have stubbed out some addition `onInit` actions that seeds in a document to the `plugin-collection`, you can use this as a base point to add more actions - and if not needed, feel free to delete it.

##### Types.ts

If your plugin has options, you should define and provide types for these options.

```ts
export type MyPluginConfig = {
  /**
   * List of collections to add a custom field
   */
  collections?: Partial<Record<CollectionSlug, true>>
  /**
   * Disable the plugin
   */
  disabled?: boolean
}
```

If possible, include JSDoc comments to describe the options and their types. This allows a developer to see details about the options in their editor.

##### Testing

Having a test suite for your plugin is essential to ensure quality and stability. **Vitest** is a fast, modern testing framework that works seamlessly with Vite and supports TypeScript out of the box.

Vitest organizes tests into test suites and cases, similar to other testing frameworks. We recommend creating individual tests based on the expected behavior of your plugin from start to finish.

Writing tests with Vitest is very straightforward, and you can learn more about how it works in the [Vitest documentation.](https://vitest.dev/)

For this template, we stubbed out `int.spec.ts` in the `dev` folder where you can write your tests.

```ts
describe('Plugin tests', () => {
  // Create tests to ensure expected behavior from the plugin
  it('some condition that must be met', () => {
   // Write your test logic here
   expect(...)
  })
})
```

## Best practices

With this tutorial and the plugin template, you should have everything you need to start building your own plugin.
In addition to the setup, here are other best practices aim we follow:

- **Providing an enable / disable option:** For a better user experience, provide a way to disable the plugin without uninstalling it. This is especially important if your plugin adds additional webpack aliases, this will allow you to still let the webpack run to prevent errors.
- **Include tests in your GitHub CI workflow**: If you’ve configured tests for your package, integrate them into your workflow to run the tests each time you commit to the plugin repository. Learn more about [how to configure tests into your GitHub CI workflow.](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)
- **Publish your finished plugin to NPM**: The best way to share and allow others to use your plugin once it is complete is to publish an NPM package. This process is straightforward and well documented, find out more [creating and publishing a NPM package here.](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).
- **Add payload-plugin topic tag**: Apply the tag **payload-plugin **to your GitHub repository. This will boost the visibility of your plugin and ensure it gets listed with [existing payload plugins](https://github.com/topics/payload-plugin).
- **Use [Semantic Versioning](https://semver.org/) (SemVar)** - With the SemVar system you release version numbers that reflect the nature of changes (major, minor, patch). Ensure all major versions reference their Payload compatibility.

# Questions

Please contact [Payload](mailto:dev@payloadcms.com) with any questions about using this plugin template.
