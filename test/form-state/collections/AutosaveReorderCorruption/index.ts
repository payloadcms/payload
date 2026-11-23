import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { autosaveReorderCorruptionSlug } from '../../slugs.js'

export const AutosaveReorderCorruption: CollectionConfig = {
  slug: autosaveReorderCorruptionSlug,
  versions: { maxPerDoc: 3, drafts: { autosave: true } },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        {
          slug: 'section',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  label: 'Content',
                  fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'content', type: 'richText', editor: lexicalEditor({}) },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
