import type { CollectionConfig } from 'payload'

import { categoriesSlug, hiddenPostsSlug, postsSlug } from '../shared.js'
import { singularSlug } from './Singular.js'

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
      admin: {
        components: {
          afterInput: ['/components/AfterInput.js#AfterInput'],
          beforeInput: ['/components/BeforeInput.js#BeforeInput'],
          Description: '/components/CustomDescription/index.js#FieldDescriptionComponent',
        },
      },
      collection: postsSlug,
      defaultSort: '-title',
      defaultLimit: 5,
      on: 'category',
      maxDepth: 1,
    },
    {
      name: 'hasManyPosts',
      type: 'join',
      collection: postsSlug,
      admin: {
        description: 'Static Description',
      },
      on: 'categories',
    },
    {
      name: 'hasManyPostsLocalized',
      type: 'join',
      collection: postsSlug,
      on: 'categoriesLocalized',
    },
    {
      name: 'hiddenPosts',
      type: 'join',
      collection: hiddenPostsSlug,
      on: 'category',
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
    {
      name: 'singulars',
      type: 'join',
      collection: singularSlug,
      on: 'category',
    },
    {
      name: 'filtered',
      type: 'join',
      collection: postsSlug,
      on: 'category',
      where: {
        isFiltered: { not_equals: true },
      },
    },
  ],
}
