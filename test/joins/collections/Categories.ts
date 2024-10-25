import type { CollectionConfig } from 'payload'

import { categoriesSlug, postsSlug } from '../shared.js'

export const Categories: CollectionConfig = {
  slug: categoriesSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    // Alternative tabs usage
    // {
    //   type: 'tabs',
    //   tabs: [
    //     {
    //       label: 'Unnamed tab',
    //       fields: [
    //         {
    //           name: 'relatedPosts',
    //           label: 'Related Posts',
    //           type: 'join',
    //           collection: postsSlug,
    //           on: 'category',
    //         },
    //       ],
    //     },
    //     {
    //       name: 'group',
    //       fields: [
    //         {
    //           name: 'relatedPosts',
    //           label: 'Related Posts (Group)',
    //           type: 'join',
    //           collection: postsSlug,
    //           on: 'group.category',
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      name: 'relatedPosts',
      label: 'Related Posts',
      type: 'join',
      collection: postsSlug,
      on: 'category',
    },
    {
      name: 'hasManyPosts',
      type: 'join',
      collection: postsSlug,
      on: 'categories',
    },
    {
      name: 'hasManyPostsLocalized',
      type: 'join',
      collection: postsSlug,
      on: 'categoriesLocalized',
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'relatedPosts',
          label: 'Related Posts (Group)',
          type: 'join',
          collection: postsSlug,
          on: 'group.category',
        },
        {
          name: 'camelCasePosts',
          type: 'join',
          collection: postsSlug,
          on: 'group.camelCaseCategory',
        },
      ],
    },
  ],
}
