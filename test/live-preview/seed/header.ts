import type { Header } from '../payload-types.js'

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
    {
      link: {
        type: 'reference',
        url: '',
        reference: {
          relationTo: 'posts',
          value: '{{POST_1_ID}}',
        },
        label: 'Post 1',
      },
    },
    {
      link: {
        type: 'reference',
        url: '',
        reference: {
          relationTo: 'posts',
          value: '{{POST_2_ID}}',
        },
        label: 'Post 2',
      },
    },
    {
      link: {
        type: 'reference',
        url: '',
        reference: {
          relationTo: 'posts',
          value: '{{POST_3_ID}}',
        },
        label: 'Post 3',
      },
    },
  ],
}
