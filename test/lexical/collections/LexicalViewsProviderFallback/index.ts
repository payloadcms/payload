import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalViewsProviderFallbackSlug } from '../../slugs.js'

/**
 * Collection to test view fallback when a parent provider forces a view
 * that the child editor doesn't define.
 *
 * Structure:
 * - Group wrapper forces currentView="frontend" with inheritable={true}
 * - Nested richtext only has a "default" view (no "frontend")
 *
 * Expected: The field should fall back to its "default" view config
 * (admin, lexical, filterFeatures) when "frontend" doesn't exist,
 * matching RichTextViewProvider's fallback logic.
 */
export const LexicalViewsProviderFallback: CollectionConfig = {
  slug: lexicalViewsProviderFallbackSlug,
  fields: [
    {
      type: 'group',
      name: 'fallbackViewWrapper',
      admin: {
        hideGutter: true,
        components: {
          Field:
            './collections/LexicalViewsProviderFallback/ViewProviderFallbackWrapper.js#ViewProviderFallbackWrapper',
        },
      },
      fields: [
        {
          name: 'richTextField',
          type: 'richText',
          editor: lexicalEditor({
            views:
              './collections/LexicalViewsProviderFallback/views.js#lexicalProviderFallbackViews',
          }),
        },
      ],
    },
  ],
  labels: {
    plural: 'Lexical Views Provider Fallback',
    singular: 'Lexical Views Provider Fallback',
  },
}
