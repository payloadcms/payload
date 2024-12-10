/**
 * IMPORTANT: Do not change this style. This specific configuration is needed to reproduce this issue before it was fixed (https://github.com/payloadcms/payload/issues/4282):
 * - lexicalEditor initialized on the outside and then shared between two richText fields
 * - tabs field with two tabs, each with a richText field
 * - each tab has a different label in each language. Needs to be a LOCALIZED label, not a single label for all languages. Only then can it be reproduced
 */

import type { GlobalConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

const initializedEditor = lexicalEditor()

const TabsWithRichText: GlobalConfig = {
  slug: 'tabsWithRichText',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'tab1',
          label: {
            en: 'en tab1',
            es: 'es tab1',
          },
          fields: [
            {
              name: 'rt1',
              type: 'richText',
              editor: initializedEditor,
            },
          ],
        },
        {
          name: 'tab2',
          label: {
            en: 'en tab2',
            es: 'es tab2',
          },
          fields: [
            {
              name: 'rt2',
              type: 'richText',
              editor: initializedEditor,
            },
          ],
        },
      ],
    },
  ],
}

export default TabsWithRichText
