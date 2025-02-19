# Payload Import/Export Plugin

A plugin for [Payload](https://github.com/payloadcms/payload) to easily import and export data.

- [Source code](https://github.com/payloadcms/payload/tree/main/packages/plugin-import-export)
- [Documentation](https://payloadcms.com/docs/plugins/import-export)
- [Documentation source](https://github.com/payloadcms/payload/tree/main/docs/plugins/import-export.mdx)

[//]: # 'TODO: Remove requirements'

## Requirements

### Exports

- [ ] The export button should be visible on the collection list.

Create writable streams for each collection and write the data to the streams. The streams should be piped to a zip stream and sent to the client.
