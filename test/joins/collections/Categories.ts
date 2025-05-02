import type { CollectionConfig } from 'payload'

import { ValidationError } from 'payload'

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
          admin: {
            defaultColumns: ['id', 'createdAt', 'title'],
          },
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
      name: 'arrayPosts',
      type: 'join',
      collection: 'posts',
      on: 'array.category',
    },
    {
      name: 'localizedArrayPosts',
      type: 'join',
      collection: 'posts',
      on: 'localizedArray.category',
    },
    {
      name: 'blocksPosts',
      type: 'join',
      collection: 'posts',
      on: 'blocks.category',
    },
    {
      name: 'polymorphic',
      type: 'join',
      collection: postsSlug,
      on: 'polymorphic',
    },
    {
      name: 'polymorphics',
      type: 'join',
      collection: postsSlug,
      on: 'polymorphics',
    },
    {
      name: 'localizedPolymorphic',
      type: 'join',
      collection: postsSlug,
      on: 'localizedPolymorphic',
    },
    {
      name: 'localizedPolymorphics',
      type: 'join',
      collection: postsSlug,
      on: 'localizedPolymorphics',
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
    {
      name: 'inTab',
      type: 'join',
      collection: postsSlug,
      on: 'tab.category',
    },
    {
      name: 'joinWithError',
      type: 'join',
      collection: postsSlug,
      on: 'category',
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.enableErrorOnJoin) {
              throw new ValidationError({
                collection: 'categories',
                errors: [
                  {
                    message: 'enableErrorOnJoin is true',
                    path: 'joinWithError',
                  },
                ],
              })
            }
          },
        ],
      },
    },
    {
      name: 'enableErrorOnJoin',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
