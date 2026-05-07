import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalViewsProviderDefaultSlug } from '../../slugs.js'

/**
 * Collection to test forcing currentView="default" with inheritable={true}.
 *
 * Even though "default" is the default value, explicitly setting it should still
 * hide the ViewSelector in nested richtext fields (because hasExplicitCurrentView is true).
 */
export const LexicalViewsProviderDefault: CollectionConfig = {
  slug: lexicalViewsProviderDefaultSlug,
  fields: [
    {
      type: 'group',
      name: 'defaultViewWrapper',
      admin: {
        hideGutter: true,
        components: {
          Field:
            './collections/LexicalViewsProviderDefault/ViewProviderDefaultWrapper.js#ViewProviderDefaultWrapper',
        },
      },
      fields: [
        {
          name: 'richTextField',
          type: 'richText',
          editor: lexicalEditor({
            views: './collections/LexicalViewsProviderDefault/views.js#lexicalProviderDefaultViews',
          }),
        },
      ],
    },
  ],
  labels: {
    plural: 'Lexical Views Provider Default',
    singular: 'Lexical Views Provider Default',
  },
}
