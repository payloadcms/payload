import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HTMLConverterFeature,
  lexicalEditor,
  lexicalHTML,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

import { richTextFieldsSlug } from '../../slugs.js'
import { RelationshipBlock, SelectFieldBlock, TextBlock, UploadAndRichTextBlock } from './blocks.js'

const RichTextFields: CollectionConfig = {
  slug: richTextFieldsSlug,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [],
}

export default RichTextFields
