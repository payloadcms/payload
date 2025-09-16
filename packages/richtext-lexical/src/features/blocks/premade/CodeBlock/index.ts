import type { Block } from 'payload'

import type { AdditionalCodeComponentProps } from './Component.js'

import { codeConverter } from './converter.js'

/**
 * @experimental - this API may change in future, minor releases
 */
export const CodeBlock: (args?: AdditionalCodeComponentProps) => Block = (args) => {
  const languages = args?.languages || {
    js: 'JavaScript',
    plaintext: 'Plain Text',
    ts: 'TypeScript',
  }

  return {
    slug: args?.slug || 'Code',
    admin: {
      jsx: '@payloadcms/richtext-lexical/client#codeConverterClient',
    },
    fields: [
      {
        name: 'language',
        type: 'select',
        defaultValue: args?.defaultLanguage || Object.keys(languages)[0],
        options: Object.entries(languages).map(([key, value]) => ({
          label: value,
          value: key,
        })),
      },
      {
        name: 'code',
        type: 'code',
        admin: {
          components: {
            Field: {
              clientProps: args,
              path: '@payloadcms/richtext-lexical/client#CodeComponent',
            },
          },
        },
      },
    ],
    jsx: codeConverter,
  }
}
