import type { Header } from '../payload-types'

export const header: Partial<Header> = {
  navItems: [
    {
      link: {
        type: 'reference',
        url: '',
        reference: {
          relationTo: 'pages',
          value: '{{POSTS_PAGE_ID}}',
        },
        label: 'Posts',
      },
    },
  ],
}
