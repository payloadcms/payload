# Payload Relationship ObjectID Plugin

This plugin automatically enables all Payload `relationship` and `upload` field types to be stored as `ObjectID`s in MongoDB.

Minimum required version of Payload: `1.9.5`

## What it does

It injects a `beforeChange` field hook into each `relationship` and `upload` field, which converts string-based IDs to `ObjectID`s immediately prior to storage.

#### Usage

Simply import and install the plugin to make it work:

```ts
import { relationshipsAsObjectID } from '@payloadcms/plugin-relationship-object-ids'
import { buildConfig } from 'payload/config'

export default buildConfig({
  // your config here
  plugins: [
    // Call the plugin within your `plugins` array
    relationshipsAsObjectID()
  ]
})
```

### Migration

Note - this plugin will only store newly created or resaved documents' relations as `ObjectID`s. It will not modify any of your existing data. If you'd like to convert existing data into an `ObjectID` format, you should write a migration script to loop over all documents in your database and then simply resave each one. 

### Support

If you need help with this plugin, [join our Discord](https://t.co/30APlsQUPB) and we'd be happy to give you a hand.

