# Payload SEO Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-seo)](https://www.npmjs.com/package/@payloadcms/plugin-seo)

A plugin for [Payload CMS](https://github.com/payloadcms/payload) to auto-generate SEO meta data based on the content of your documents.

Core features:

- Adds a `meta` field to every SEO-enabled collection or global. It:
  - includes title, description, and image subfields
  - auto-generates meta data from your document's content
  - displays hints and indicators to help content editors
  - renders a snippet of what a search engine might display
  - soon will support variable injection

## Installation

```bash
  yarn add @payloadcms/plugin-seo
  # OR
  npm i @payloadcms/plugin-seo
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config';
import seo from '@payloadcms/plugin-seo';

const config = buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: []
    },
    {
      slug: 'media',
      upload: {
        staticDir: // path to your static directory,
      },
      fields: []
    }
  ],
  plugins: [
    seo({
      collections: [
        'pages',
      ],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `Website.com — ${doc.title.value}`,
      generateDescription: ({ doc }) => doc.excerpt
    })
  ]
});

export default config;
```

### Options

- `collections` : string[] | optional

  An array of collections slugs to enable SEO. Enabled collections receive a `meta` field which is an object of title, description, and image subfields.

- `globals` : string[] | optional

  An array of global slugs to enable SEO. Enabled globals receive a `meta` field which is an object of title, description, and image subfields.

- `uploadsCollection` : string | optional

  An upload-enabled collection slug, for the meta image to access.

- `tabbedUI` : boolean | optional

  Displays meta fields as tabs using Payload's [Tabs Field](https://payloadcms.com/docs/fields/tabs). Defaults to `false`.

- `generateTitle` : method | optional

  A function that allows you to return any meta title, including from document's content.

  ```js
  seo({
    ...
    generateTitle: ({ doc, locale }) => `Website.com — ${doc?.title?.value}`,
  })
  ```

- `generateDescription` : method | optional

  A function that allows you to return any meta description, including from document's content.

  ```js
  seo({
    ...
    generateDescription: ({ doc, locale }) => doc?.excerpt?.value
  })
  ```

- `generateImage` : method | optional

  A function that allows you to return any meta image, including from document's content.

  ```js
  seo({
   ...
   generateImage: ({ doc, locale }) => doc?.featuredImage?.value
  })
  ```

- `generateURL` : method | optional

  A function called by the search preview component to display the actual URL of your page.

  ```js
  seo({
    ...
    generateURL: ({ doc, locale }) => `https://yoursite.com/${doc?.slug?.value}`
  })
  ```

## TypeScript

All types can be directly imported:

```js
import {
  PluginConfig,
  GenerateTitle,
  GenerateDescription
  GenerateURL
} from '@payloadcms/plugin-seo/dist/types';
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
   1. Now `cd` back into your own project and run, `yarn link @payloadcms/plugin-seo`
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
             "@payloadcms/plugin-seo": path.join(
               __dirname,
               "../../payload/plugin-seo/src"
             ),
           },
         },
       }),
     },
   });
   ```

## Screenshots

![image](https://user-images.githubusercontent.com/70709113/163850633-f3da5f8e-2527-4688-bc79-17233307a883.png)

<!-- ![screenshot 1](https://github.com/@payloadcms/plugin-seo/blob/main/images/screenshot-1.jpg?raw=true) -->
