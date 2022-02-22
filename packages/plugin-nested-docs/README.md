# Payload Breadcrumbs Plugin

[![NPM](https://img.shields.io/npm/v/payload-plugin-breadcrumbs)](https://www.npmjs.com/package/payload-plugin-breadcrumbs)

A breadcrumbs for [Payload CMS](https://github.com/payloadcms/payload) to easily allow for nested documents.

Core features:

## Installation

```bash
  yarn add payload-plugin-breadcrumbs
  # OR
  npm i payload-plugin-breadcrumbs
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config';
import breadcrumbs from 'payload-plugin-breadcrumbs';

const config = buildConfig({
  plugins: [
    breadcrumbs({
      collections: [''],
      parentFieldSlug: '',
      breadcrumbsFieldSlug: '',
      generateLabel: '',
      generateURL: ''
    })
  ]
});

export default config;
```

### Options

- `collections`

    An array of collections slugs to enable breadcrumbs.

  ## TypeScript

  All types can be directly imported:
  ```js
  import {
    BreadcrumbsConfig,
   } from 'payload-plugin-breadcrumbs/dist/types';
  ```

  ## Screenshots

  <!-- ![screenshot 1](https://github.com/trouble/payload-plugin-breadcrumbs/blob/main/images/screenshot-1.jpg?raw=true) -->
