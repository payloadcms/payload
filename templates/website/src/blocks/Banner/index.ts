import type { Block } from 'payload/types'

import { richText } from '../../fields/richText'

export const Banner: Block = {
  slug: 'banner',
  fields: [
    richText(
      { name: 'content', label: false },
      {
        features: {
          blocks: [],
          heading: [],
          link: false,
          upload: false,
        },
      },
    ),
  ],
}
