# Payload Password Protection Plugin

[![NPM](https://img.shields.io/npm/v/payload-plugin-password-protection)](https://www.npmjs.com/package/payload-plugin-password-protection)

A plugin for [Payload](https://github.com/payloadcms/payload) to easily allow for documents to be secured behind a layer of password protection.

## Installation

```bash
  yarn add payload-plugin-password-protection
  # OR
  npm i payload-plugin-password-protection
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config';
import passwordProtection from 'payload-plugin-password-protection';

const config = buildConfig({
  collections: [
  plugins: [
    passwordProtection({
      collections: ['pages'],
    })
  ]
});

export default config;
```

### Options

#### `collections`

An array of collections slugs to enable password protection.

## TypeScript

All types can be directly imported:

```js
import { PasswordProtectionConfig } from "payload-plugin-password-protection/dist/types";
```

## Screenshots

<!-- ![screenshot 1](https://github.com/trouble/payload-plugin-password-protection/blob/main/images/screenshot-1.jpg?raw=true) -->
