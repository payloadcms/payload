# Payload Zapier Plugin

This plugin can be added to a Payload project to make it simple to send Zaps to a zapier webhook address when collection data changes. It is designed to be flexible and generic to allow for all use-cases to manage zaps.

### How it works
When a collection is created/updated/deleted, the plugin will send a Zap to the webhook address. The Zap will contain the collection name, the operation (create/update/delete), and the data related to the document.

We recommend starting with the Zapier Paths + Webhooks template to get started. [See here](https://zapier.com/apps/paths/integrations/webhook). Using Paths, will allow you to handle many different types of data and operations coming from Payload.

### Requirements

- A Zapier account with 1 webhook configured. [More](https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks)
- A Payload project

## Plugin Config Example


```ts
/* file: payload.config.ts */

import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { zapierPlugin } from '@payloadcms/plugin-zapier'

export default buildConfig({
  // ...rest of your config goes here
  plugins: [
    zapierPlugin({
      collections: ['posts'],
      webhookURL: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
      enabled: async req => {
        // -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
        // `enabled` can be a boolean OR a function that returns a boolean.
        //
        // if it is a function, it will be passed the following arguments:
        //  - all arguments from the hook that triggered the Zap
        //  - operation (create/update/delete)
        // -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
        return req.user.role === 'admin'
      },
    }),
  ],
})
```
This plugin is configurable to work across many different Payload collections. A * denotes that the property is required. [Types file](./src/types.ts).
| Option                        | Description |
| ----------------------------- | ----------- |
| **`collections`***            | Array of collection slugs that will  send data to Zapier. `["*"]` can be used to zap every collection. |
| **`webhookURL`***             | Zapier webhook URL to send events to. |
| **`enabled`**                 | Function or boolean value that is checked before a Zap is sent. |

## Features

**Send Zaps**
Allows for events to be sent to Zapier when a specified collection is updated or deleted.

#### Webhook Data

The data sent to the Zapier webhook URL will include:

1. The `collection` slug that triggered the zap.
1. The `operation` used, one of: 'create', 'update', or 'delete'.
1. The `data` object, which is the Payload document that was created, updated, or deleted.
