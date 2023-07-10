# Payload Nested Docs Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-nested-docs)](https://www.npmjs.com/package/@payloadcms/plugin-nested-docs)

A plugin for [Payload CMS](https://github.com/payloadcms/payload) to easily allow for documents to be nested inside one another.

Core features:

- Allows for [parent/child](#parent) relationships between documents
- Automatically populates [breadcrumbs](#breadcrumbs) data

## Installation

```bash
  yarn add @payloadcms/plugin-nested-docs
  # OR
  npm i @payloadcms/plugin-nested-docs
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from "payload/config";
import nestedDocs from "@payloadcms/plugin-nested-docs";

const config = buildConfig({
  collections: [
    {
      slug: "pages",
      fields: [
        {
          name: "title",
          type: "text",
        },
        {
          name: "slug",
          type: "text",
        },
      ],
    },
  ],
  plugins: [
    nestedDocs({
      collections: ["pages"],
      generateLabel: (_, doc) => doc.title,
      generateURL: (docs) =>
        docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
    }),
  ],
});

export default config;
```

### Fields

#### Parent

The `parent` relationship field is automatically added to every document which allows editors to choose another document from the same collection to act as the direct parent.

#### Breadcrumbs

The `breadcrumbs` field is an array which dynamically populates all parent relationships of a document up to the top level. It does not store any data in the database, and instead, acts as a `virtual` field which is dynamically populated each time the document is loaded.

The `breadcrumbs` array stores the following fields:

- `label`

  The label of the breadcrumb. This field is automatically set to either the `collection.admin.useAsTitle` (if defined) or is set to the `ID` of the document. You can also dynamically define the `label` by passing a function to the options property of [`generateLabel`](#generateLabel).

- `url`

  The URL of the breadcrumb. By default, this field is undefined. You can manually define this field by passing a property called function to the plugin options property of [`generateURL`](#generateURL).

### Options

#### `collections`

An array of collections slugs to enable nested docs.

#### `generateLabel`

Each `breadcrumb` has a required `label` field. By default, its value will be set to the collection's `admin.useAsTitle` or fallback the the `ID` of the document.

You can also pass a function to dynamically set the `label` of your breadcrumb.

```js
{
plugins: [
  ...
  nestedDocs({
    ...
    generateLabel: (_, doc) => doc.title // NOTE: 'title' is a hypothetical field
  })
]
```

The function takes two arguments and returns a string:

1. `breadcrumbs` - an array of the breadcrumbs up to that point
2. `currentDoc` - the current document being edited

#### `generateURL`

A function that allows you to dynamically generate each breadcrumb `url`. Each `breadcrumb` has an optional `url` field which is undefined by default. For example, you might want to format a full URL to contain all of the breadcrumbs up to that point, like `/about-us/company/our-team`.

```js
plugins: [
  ...
  nestedDocs({
    ...
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''), // NOTE: 'slug' is a hypothetical field
  })
]
```

This function takes two arguments and returns a string:

1. `breadcrumbs` - an array of the breadcrumbs up to that point
1. `currentDoc` - the current document being edited

#### `parentFieldSlug`

When defined, the `parent` field will not be provided for you automatically, and instead, expects you to add your own `parent` field to each collection manually. This gives you complete control over where you put the field in your admin dashboard, etc. Set this property to the `name` of your custom field.

#### `breadcrumbsFieldSlug`

When defined, the `breadcrumbs` field will not be provided for you, and instead, expects your to add your own `breadcrumbs` field to each collection manually. Set this property to the `name` of your custom field.

> Note - if you opt out of automatically being provided a `parent` or `breadcrumbs` field, you need to make sure that both fields are placed at the top-level of your document. They cannot exist within any nested data structures like a `group`, `array`, or `blocks`.

## Overrides

You can also extend the built-in `parent` and `breadcrumbs` fields per collection by using the `createParentField` and `createBreadcrumbField` methods. They will merge your customizations overtop the plugin's base field configurations.

```js
import { CollectionConfig } from "payload/types";
import createParentField from "@payloadcms/plugin-nested-docs/fields/parent";
import createBreadcrumbsField from "@payloadcms/plugin-nested-docs/fields/breadcrumbs";

const examplePageConfig: CollectionConfig = {
  slug: "pages",
  fields: [
    createParentField(
      // First argument is equal to the slug of the collection
      // that the field references
      "pages",

      // Second argument is equal to field overrides that you specify,
      // which will be merged into the base parent field config
      {
        admin: {
          position: "sidebar",
        },
        // Note: if you override the `filterOptions` of the `parent` field,
        // be sure to continue to prevent the document from referencing itself as the parent like this:
        // filterOptions: ({ id }) => ({ id: {not_equals: id }})`
      }
    ),
    createBreadcrumbsField(
      // First argument is equal to the slug of the collection
      // that the field references
      "pages",

      // Argument equal to field overrides that you specify,
      // which will be merged into the base `breadcrumbs` field config
      {
        label: "Page Breadcrumbs",
      }
    ),
  ],
};
```

## Localization

This plugin supports localization by default. If the `localization` property is set in your Payload config, the `breadcrumbs` field is automatically localized. For more details on how localization works in Payload, see the [Localization](https://payloadcms.com/docs/localization/overview) docs.

## TypeScript

All types can be directly imported:

```js
import {
  PluginConfig,
  GenerateURL,
  GenerateLabel,
} from "@payloadcms/plugin-nested-docs/types";
```

## Development

To actively develop or debug this plugin you can either work directly within the demo directory of this repo, or link your own project.

1. #### Internal Demo

   This repo includes a fully working, self-seeding instance of Payload that installs the plugin directly from the source code. This is the easiest way to get started. To spin up this demo, follow these steps:

   1. First clone the repo
   1. Then, `cd YOUR_PLUGIN_REPO && yarn && cd demo && yarn && yarn dev`
   1. Now open `http://localhost:3000/admin` in your browser
   1. Enter username `dev@payloadcms.com` and password `test`

   That's it! Changes made in `./src` will be reflected in your demo. Keep in mind that the demo database is automatically seeded on every startup, any changes you make to the data get destroyed each time you reboot the app.

1. #### Linked Project

   You can alternatively link your own project to the source code:

   1. First clone the repo
   1. Then, `cd YOUR_PLUGIN_REPO && yarn && cd demo && cp env.example .env && yarn && yarn dev`
   1. Now `cd` back into your own project and run, `yarn link @payloadcms/plugin-nested-docs`
   1. If this plugin using React in any way, continue to the next step. Otherwise skip to step 7.
   1. From your own project, `cd node_modules/react && yarn link && cd ../react-dom && yarn link && cd ../../`
   1. Then, `cd YOUR_PLUGIN_REPO && yarn link react react-dom`

   All set! You can now boot up your own project as normal, and your local copy of the plugin source code will be used. Keep in mind that changes to the source code require a rebuild, `yarn build`.

   You might also need to alias these modules in your Webpack config. To do this, open your project's Payload config and add the following:

   ```js
   import { buildConfig } from "payload/config";

   export default buildConfig({
     admin: {
       webpack: (config) => ({
         ...config,
         resolve: {
           ...config.resolve,
           alias: {
             ...config.resolve.alias,
             react: path.join(__dirname, "../node_modules/react"),
             "react-dom": path.join(__dirname, "../node_modules/react-dom"),
             payload: path.join(__dirname, "../node_modules/payload"),
             "@payloadcms/plugin-nested-docs": path.join(
               __dirname,
               "../../payload/plugin-nested-docs/src"
             ),
           },
         },
       }),
     },
   });
   ```

## Screenshots
