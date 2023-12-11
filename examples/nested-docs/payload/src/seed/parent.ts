import path from 'path'
import type { Page } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

export const parent: Partial<Page> = {
  title: 'Parent Page',
  slug: 'parent',
  richText: [
    {
      children: [
        {
          text: 'This is the parent page. From here you can navigate to the ',
        },
        {
          type: 'link',
          linkType: 'reference',
          doc: {
            value: '{{CHILD_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'child page',
            },
          ],
        },
        {
          text: ' or the ',
        },
        {
          type: 'link',
          linkType: 'reference',
          doc: {
            value: '{{GRANDCHILD_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'grandchild page',
            },
          ],
        },
        {
          text: '.',
        },
      ],
    },
  ],
}
