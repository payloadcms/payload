import path from 'path'
import type { Page } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

export const child: Partial<Page> = {
  title: 'Child Page',
  slug: 'child',
  parent: '{{PARENT_PAGE_ID}}',
  richText: [
    {
      children: [
        {
          text: 'This is the child page. From here you can navigate to the ',
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
