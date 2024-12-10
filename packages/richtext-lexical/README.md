# Payload Lexical Rich Text Editor

Lexical Rich Text Editor for [Payload](https://payloadcms.com).

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/richtext-lexical
```

## Usage

```ts
import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export default buildConfig({
  editor: lexicalEditor({}),
  // ...rest of config
})
```

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).
