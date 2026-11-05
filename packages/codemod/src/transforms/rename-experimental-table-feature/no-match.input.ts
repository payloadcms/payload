import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const editor = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
})
