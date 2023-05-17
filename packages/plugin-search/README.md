# Payload Search Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-search)](https://www.npmjs.com/package/@payloadcms/plugin-search)

A plugin for [Payload](https://github.com/payloadcms/payload) to create extremely fast search results from your existing documents.

Core features:

- Creates a `search` collection that:
  - Automatically creates, syncs, and deletes search results related to your documents
  - Serves search results extremely quickly by saving only search-critical data that you define
  - Allows you to sort search results by priority

## Installation

```bash
  yarn add @payloadcms/plugin-search
  # OR
  npm i @payloadcms/plugin-search
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from "payload/config";
import search from "@payloadcms/plugin-search";

const config = buildConfig({
  collections: [
    {
      slug: "pages",
      fields: [],
    },
    {
      slug: "posts",
      fields: [],
    },
  ],
  plugins: [
    search({
      collections: ["pages", "posts"],
      defaultPriorities: {
        pages: 10,
        posts: 20,
      },
    }),
  ],
});

export default config;
```

### Options

#### `collections`

An array of collections slugs to enable sync-to-search. Enabled collections receive a `beforeChange` and `afterDelete` hook that creates, syncs, and deleted the document to its related search document as it changes over time, and also an `afterDelete` hook that deletes.

#### `defaultPriorities`

The default priorities first set on `create` operations. Send an object of collection slugs, and set them to either a number or a function.

```js
plugins: [
  searchPlugin({
    defaultPriorities: {
      pages: ({ doc }) => (doc.title.startsWith("Hello, world!") ? 1 : 10),
      posts: 20,
    },
  }),
];
```

#### `searchOverrides`

Override anything on the search collection by sending a [Payload Collection Config](https://payloadcms.com/docs/configuration/collections).

```js
plugins: [
  searchPlugin({
    searchOverrides: {
      slug: "search-results",
    },
  }),
];
```

#### `beforeSync`

An [afterChange](<[afterChange](https://payloadcms.com/docs/hooks/globals#afterchange)>) hook that is called before creating or syncing the document to search. This allows you to modify the data in any way before doing so.

```js
plugins: [
  searchPlugin({
    beforeSync: ({ originalDoc, searchDoc }) => ({
      ...searchDoc,
      // Modify your docs in any way here, this can be async
      excerpt: originalDoc?.excerpt || "This is a fallback excerpt",
    }),
  }),
];
```

#### `syncDrafts`

If true, will sync draft documents to search. By default, this plugin will only sync published documents. False by default. You must have [Payload Drafts](https://payloadcms.com/docs/versions/drafts) enabled for this to apply.

#### `deleteDrafts`

If true, will delete documents from search that change to draft status. True by default. You must have [Payload Drafts](https://payloadcms.com/docs/versions/drafts) enabled for this to apply.

## TypeScript

All types can be directly imported:

```js
import { SearchConfig, BeforeSync } from "@payloadcms/plugin-search/dist/types";
```

## Screenshots
