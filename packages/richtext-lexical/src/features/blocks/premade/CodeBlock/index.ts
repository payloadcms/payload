import type { Block } from 'payload'

import type { AdditionalCodeComponentProps } from './Component/Code.js'

import { defaultLanguages } from './Component/defaultLanguages.js'
import { codeConverter } from './converter.js'

/**
 * @experimental - this API may change in future, minor releases
 */
export const CodeBlock: (
  args?: {
    fieldOverrides?: Partial<Block>
  } & AdditionalCodeComponentProps,
) => Block = (_args) => {
  const { fieldOverrides, ...args } = _args || {}
  const languages = args?.languages || defaultLanguages

  return {
    slug: args?.slug || 'Code',
    admin: {
      components: {
        Block: {
          clientProps: {
            // If default languages are used, return undefined (=> do not pass `languages` variable) in order to reduce data sent to the client
            languages: args?.languages,
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
    ...(fieldOverrides || {}),
  }
}
