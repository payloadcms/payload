# Payload Zapier Plugin

This plugin can be added to a Payload project to make it simple to send Zaps to a zapier webhook address when collection data changes. It is designed to be flexible and generic to allow for any use-cases to manage zaps.

#### Requirements

- A Payload project
- A Zapier account with webhooks configured. [More](https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks)

## Usage

Install this plugin within your Payload as follows:

```ts
import { buildConfig } from 'payload/config';
import path from 'path';
import Users from './collections/Users';
import { zapierPlugin } from '@payloadcms/plugin-zapier';

export default buildConfig({
  plugins: [
    zapierPlugin({
      collections: [{
        slug: 'users',
        webhook: "https://hooks.zapier.com/hooks/catch/12345678/1234567/",
        hooks: ['afterUpdate', 'afterDelete'],
      }]
    }),
  ],
  // The rest of your config goes here
});
```

## Features

**Send Zaps**
The plugin adds Payload hooks to call the specified Zapier webhooks to enable zaps to other services.

## Plugin options

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option                        | Description |
| ----------------------------- | ----------- |
| **[`collections`]** *         | Array of collection-specific options to enable the plugin for. |

#### Collection-specific options

Each collection extends options.

| Option                     | Description                                                                                                     |
|----------------------------|-----------------------------------------------------------------------------------------------------------------|
| **[`slug`]** *             | The collection slug to extend.                                                                                  |
| **[`webhook`]** *          | The webhook url set up in Zapier [More](https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks) |
| **[`hooks`]** *            | An array defining when the webhook should be called from Payload.                                               |


#### Webhook Data

The data sent to the Zapier endpoint will include:

1. The `collection` slug.
1. The `operation` used, one of: 'create', 'update', or 'delete'.
1. All the properties of the document being changed that the current user has access to.
