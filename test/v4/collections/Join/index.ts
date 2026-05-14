import type { CollectionConfig } from 'payload'

import { joinFieldsSlug, joinPostsSlug } from '../../slugs.js'

/**
 * Collection for testing Join field variants.
 * Join fields display related documents from JoinPosts collection.
 */
const JoinFields: CollectionConfig = {
  slug: joinFieldsSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // Default join field
    {
      name: 'relatedPosts',
      type: 'join',
      collection: joinPostsSlug,
      on: 'category',
      label: 'Related Posts',
      admin: {
        description: 'Posts related to this category',
      },
    },
    // Join field with custom columns
    {
      name: 'postsWithColumns',
      type: 'join',
      collection: joinPostsSlug,
      on: 'category',
      label: 'Posts (Custom Columns)',
      admin: {
        defaultColumns: ['title', '_status', 'createdAt'],
        description: 'Join field with custom default columns',
      },
    },
    // Join field with default limit
    {
      name: 'postsLimited',
      type: 'join',
      collection: joinPostsSlug,
      on: 'category',
      label: 'Posts (Limited)',
      defaultLimit: 3,
      admin: {
        description: 'Join field with default limit of 3',
      },
    },
    // Join field with default sort
    {
      name: 'postsSorted',
      type: 'join',
      collection: joinPostsSlug,
      on: 'category',
      label: 'Posts (Sorted)',
      defaultSort: '-title',
      admin: {
        description: 'Join field sorted by title descending',
      },
    },
    // Join field without row types
    {
      name: 'postsNoRowTypes',
      type: 'join',
      collection: joinPostsSlug,
      on: 'category',
      label: 'Posts (No Row Types)',
      admin: {
        disableRowTypes: true,
        description: 'Join field with row types disabled',
      },
    },
    // Join field inside a group
    {
      name: 'group',
      type: 'group',
      label: 'Grouped Join Field',
      fields: [
        {
          name: 'groupedPosts',
          type: 'join',
          collection: joinPostsSlug,
          on: 'category',
          label: 'Grouped Posts',
          admin: {
            description: 'Join field inside a group',
          },
        },
      ],
    },
  ],
}

export default JoinFields
