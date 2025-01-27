import path from 'path'
import type { Page } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

export const grandchild: Partial<Page> = {
  title: 'Grandchild Page',
  slug: 'grandchild',
  parent: '{{CHILD_PAGE_ID}}',
  richText: [
    {
      children: [
        {
          text: 'This is the grandchild page. From here you can navigate to the ',
        },
        {
          type: 'link',
          linkType: 'reference',
          doc: {
            value: '{{PARENT_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'parent page',
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
          text: '.',
        },
      ],
    },
  ],
}
