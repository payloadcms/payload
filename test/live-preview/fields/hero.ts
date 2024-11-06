import type { Field, FieldHook } from 'payload'

import {
  consolidateHTMLConverters,
  convertLexicalToHTML,
  defaultEditorConfig,
  defaultEditorFeatures,
  HTMLConverterFeature,
  lexicalEditor,
  sanitizeServerEditorConfig,
} from '@payloadcms/richtext-lexical'
import { SlateToLexicalFeature } from '@payloadcms/richtext-lexical/migrate'

const hook: FieldHook = async ({ req, siblingData }) => {
  const editorConfig = defaultEditorConfig

  editorConfig.features = [...defaultEditorFeatures, HTMLConverterFeature({})]

  const sanitizedEditorConfig = await sanitizeServerEditorConfig(editorConfig, req.payload.config)

  const html = await convertLexicalToHTML({
    converters: consolidateHTMLConverters({ editorConfig: sanitizedEditorConfig }),
    data: siblingData.lexicalSimple,
    req,
  })
  console.log('HTML:', html)
  // return html
}

export const hero: Field = {
  name: 'hero',
  label: false,
  type: 'group',
  fields: [
    {
      type: 'select',
      name: 'type',
      label: 'Type',
      required: true,
      defaultValue: 'lowImpact',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
      ],
    },
    {
      name: 'richText',
      label: 'Rich Text',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, SlateToLexicalFeature({})],
      }),
      hooks: {
        afterRead: [hook],
        beforeValidate: [hook],
        afterChange: [hook],
      },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        condition: (_, { type } = {}) => ['highImpact'].includes(type),
      },
    },
  ],
}
