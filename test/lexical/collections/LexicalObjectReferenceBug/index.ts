import type { CollectionConfig } from 'payload'

import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'

/**
 * Do not change this specific CollectionConfig. Simply having this config in payload used to cause the admin panel to hang.
 * Thus, simply having this config in the test suite is enough to test the bug fix and prevent regressions. In case of regression,
 * the entire admin panel will hang again and all tests will fail.
 */
export const LexicalObjectReferenceBugCollection: CollectionConfig = {
  slug: 'lexicalObjectReferenceBug',
  fields: [
    {
      name: 'lexicalDefault',
      type: 'richText',
    },
    {
      name: 'lexicalEditor',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          UploadFeature({
            collections: {
              media: {
                fields: [
                  {
                    name: 'caption',
                    type: 'richText',
                  },
                ],
              },
            },
          }),
        ],
      }),
    },
  ],
}
