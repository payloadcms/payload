import type { CollectionConfig } from 'payload'

import { lexicalEditor, LinkFeature, ParagraphFeature } from '@payloadcms/richtext-lexical'

import { pagesSlug } from './pages.js'

export const postsSlug = 'posts'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    /**
     * Control: a plain relationship field to `pages`. The multi-tenant plugin
     * patches this field's `filterOptions` directly via `addFilterOptionsToFields`,
     * so it is expected to always be tenant-scoped.
     */
    {
      name: 'relatedPage',
      type: 'relationship',
      relationTo: pagesSlug,
    },
    /**
     * RichText field using LinkFeature with its default configuration. Internal
     * link targets are derived from `admin.enableRichTextLink` on each collection.
     */
    {
      name: 'contentDefaultLink',
      type: 'richText',
      editor: lexicalEditor({
        features: [ParagraphFeature(), LinkFeature()],
      }),
    },
    /**
     * RichText field using LinkFeature with an explicit `enabledCollections`.
     * Regression coverage for #17765: passing `enabledCollections` must not cause
     * the internal link picker to lose the tenant `baseFilter`.
     */
    {
      name: 'contentEnabledCollectionsLink',
      type: 'richText',
      editor: lexicalEditor({
        features: [ParagraphFeature(), LinkFeature({ enabledCollections: [pagesSlug] })],
      }),
    },
  ],
  versions: false,
}
