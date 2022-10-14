# Payload Zapier Plugin

This plugin can be added to a Payload project to make it simple to send Zaps to a zapier webhook address when collection data changes. It is designed to be flexible and generic to allow for any use-cases to manage zaps.

#### Requirements

- A Zapier account with 1 webhook configured. [More](https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks)
- A Payload project

## Usage

Install this plugin within your Payload as follows:

```ts
import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { zapierPlugin } from '@payloadcms/plugin-zapier'

export default buildConfig({
  // ...Rest of your config goes here
  plugins: [
    zapierPlugin({
      collections: ['posts'], // Required. Collections to zap afterChange and afterDelete.
      webhookURL: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', // Required. Zapier webhook URL.
    }),
  ],
})
```

## Features

**Send Zaps**
Allows for events to be sent to Zapier when a specified collection is updated or deleted.

**Setup**


## Plugin configuration

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option                        | Description |
| ----------------------------- | ----------- |
| **[`collections`]**         | Array of collection slugs that will send data to Zapier. `"*"` can be used to zap every collection afterChange/afterDelete event. Type: `Array<string> | "*"` |
| **[`webhookURL`]**          | Your Zapier endpoint to send events to. Type: `string`                         |


#### Webhook Data

The data sent to the Zapier endpoint will include:

1. The `collection` slug that triggered the zap.
1. The `operation` used, one of: 'create', 'update', or 'delete'.
1. The `data` object, which is the Payload document that was created, updated, or deleted.
