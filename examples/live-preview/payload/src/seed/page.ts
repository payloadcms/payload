import type { Page } from '../payload-types'

export const examplePage: Partial<Page> = {
  title: 'Example Page',
  slug: 'example-page',
  richText: [
    {
      type: 'h1',
      children: [
        {
          text: 'Example Page',
        },
      ],
    },
    {
      children: [
        {
          text: 'This is an example page. You can edit this page in the Admin panel and see the changes reflected here in real time.',
        },
      ],
    },
  ],
}
