import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { codeFieldsSlug } from '../../slugs'

const Code: CollectionConfig = {
  fields: [
    {
      name: 'javascript',
      admin: {
        language: 'javascript',
      },
      type: 'code',
    },
    {
      name: 'typescript',
      admin: {
        language: 'typescript',
      },
      type: 'code',
    },
    {
      name: 'json',
      admin: {
        language: 'json',
      },
      type: 'code',
    },
    {
      name: 'html',
      admin: {
        language: 'html',
      },
      type: 'code',
    },
    {
      name: 'css',
      admin: {
        language: 'css',
      },
      type: 'code',
    },
  ],
  slug: codeFieldsSlug,
}

export default Code
