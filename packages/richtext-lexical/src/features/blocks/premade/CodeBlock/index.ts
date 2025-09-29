import type { Block } from 'payload'

import type { AdditionalCodeComponentProps } from './Component/Code.js'

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
      components: {
        Block: {
          clientProps: {
            languages,
          },
          path: '@payloadcms/richtext-lexical/client#CodeBlockBlockComponent',
        },
      },
      jsx: '@payloadcms/richtext-lexical/client#codeConverterClient',
    },
    fields: [
      {
        name: 'language',
        type: 'select',
        admin: {
          // We'll manually render this field into the block component header
          hidden: true,
        },
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
        label: '',
      },
    ],
    jsx: codeConverter,
  }
}
