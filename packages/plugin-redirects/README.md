# Payload Redirects Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-redirects)](https://www.npmjs.com/package/@payloadcms/plugin-redirects)

A plugin for [Payload CMS](https://github.com/payloadcms/payload) to easily manage your redirects.

Core features:

- Adds a `redirects` collection to your config that:
  - includes a `from` and `to` fields
  - allows `to` to be a document reference

## Installation

```bash
  yarn add @payloadcms/plugin-redirects
  # OR
  npm i @payloadcms/plugin-redirects
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from "payload/config";
import redirects from "@payloadcms/plugin-redirects";

const config = buildConfig({
  collections: [
    {
      slug: "pages",
      fields: [],
    },
  ],
  plugins: [
    redirects({
      collections: ["pages"],
    }),
  ],
});

export default config;
```

### Options

- `collections` : string[] | optional

  An array of collections slugs to populate in the `to` field of each redirect.

- `overrides` : object | optional

  A partial collection config that allows you to override anything on the `redirects` collection.

## TypeScript

All types can be directly imported:

```js
import { PluginConfig } from "@payloadcms/plugin-redirects/types";
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
   1. Now `cd` back into your own project and run, `yarn link @payloadcms/plugin-redirects`
   1. If this plugin using React in any way, continue to the next step. Otherwise skip to step 7.
   1. From your own project, `cd node_modules/react && yarn link && cd ../react-dom && yarn link && cd ../../`
   1. Then, `cd YOUR_PLUGIN_REPO && yarn link react react-dom`

   All set! You can now boot up your own project as normal, and your local copy of the plugin source code will be used. Keep in mind that changes to the source code require a rebuild, `yarn build`.

## Screenshots
