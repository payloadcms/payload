import type { Field } from 'payload'

import { lexicalEditor, RelationshipFeature } from '@payloadcms/richtext-lexical'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { LocalizedPosts } from './collections/localized-posts.js'
import { Media } from './collections/media.js'
import { draftMediaSlug, localizedPostsSlug } from './slugs.js'

const relationshipFields: Field[] = [
  { name: 'related', type: 'relationship', relationTo: localizedPostsSlug },
  { name: 'upload', type: 'upload', relationTo: draftMediaSlug },
  { name: 'relatedMany', type: 'relationship', relationTo: localizedPostsSlug, hasMany: true },
  { name: 'polymorphic', type: 'relationship', relationTo: [localizedPostsSlug] },
  { name: 'polymorphicUpload', type: 'upload', relationTo: [draftMediaSlug] },
]

export default buildConfigWithDefaults({
  config: {
    typescript: { autoGenerate: false },
    collections: [
      {
        ...LocalizedPosts,
        fields: [
          { name: 'title', type: 'text', required: true, localized: true },
          ...relationshipFields,
          { name: 'group', type: 'group', fields: relationshipFields },
          { type: 'tabs', tabs: [{ name: 'tab', fields: relationshipFields }] },
          { name: 'rows', type: 'array', fields: relationshipFields },
          { name: 'children', type: 'join', collection: localizedPostsSlug, on: 'related' },
          {
            name: 'richText',
            type: 'richText',
            editor: lexicalEditor({
              features: () => [RelationshipFeature({ enabledCollections: [localizedPostsSlug] })],
            }),
          },
        ],
        hooks: {
          afterChange: [
            async ({ doc, operation, req }) => {
              if (operation === 'create' && doc.title === 'Parent') {
                const data = { title: `Joined ${req.locale}`, related: doc.id }
                await req.payload.create({
                  collection: localizedPostsSlug,
                  data,
                  req,
                  version: 'published',
                })
              }
              return doc
            },
          ],
        },
        versions: { drafts: { localizeStatus: true } },
      },
      Media,
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  suite: 'version-selector-graphql-locales',
})
