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
import { buildConfig } from 'payload/config';
import nestedDocs from '@payloadcms/plugin-nested-docs';

const config = buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text'
        },
        {
          name: 'slug',
          type: 'text'
        }
      ]
    }
  ],
  plugins: [
    nestedDocs({
      collections: ['pages'],
      generateLabel: (_, doc) => doc.title,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    })
  ]
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

  An array of collections slugs to enable nested pages.

#### `generateLabel`

Each `breadcrumb` has a required `label` field. By default, its value will be set to the collection's `admin.useAsTitle` or fallback the the `ID` of the document.

You can also pass a function to dynamically set the `label` of your breadcrumb.

```js
{
plugins: [
  ...
  nestedPages({
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
  nestedPages({
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

## More

You can also extend the built-in `parent` and `breadcrumbs` fields on a page-by-page basis by importing helper methods as follows:

```js
import { CollectionConfig } from 'payload/types';
import createParentField from '@payloadcms/plugin-nested-docs/fields/parent';
import createBreadcrumbsField from '@payloadcms/plugin-nested-docs/fields/breadcrumbs';

const examplePageConfig: CollectionConfig = {
  slug: 'pages',
  fields: [
    createParentField(
      // First argument is equal to the slug of the collection
      // that the field references
      'pages',

      // Second argument is equal to field overrides that you specify,
      // which will be merged into the base parent field config
      {
        admin: {
          position: 'sidebar',
        },
      },
    ),
    createBreadcrumbsField(
      // First argument is equal to the slug of the collection
      // that the field references
      'pages',

      // Argument equal to field overrides that you specify,
      // which will be merged into the base `breadcrumbs` field config
      {
        label: 'Page Breadcrumbs',
      }
    )
  ]
}
```

## TypeScript

All types can be directly imported:
```js
import {
  NestedPagesConfig,
  GenerateURL,
  GenerateLabel
} from '@payloadcms/plugin-nested-docs/dist/types';
```

## Screenshots

<!-- ![screenshot 1](https://github.com/@payloadcms/plugin-nested-docs/blob/main/images/screenshot-1.jpg?raw=true) -->
