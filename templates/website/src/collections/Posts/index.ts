import type { CollectionConfig } from 'payload/types'

import { richText } from 'src/fields/richText'

import type { Post } from '../../payload-types'

import { admins } from '../../access/admins'
import { usersOrPublished } from '../../access/usersOrPublished'
import { Banner } from '../../blocks/Banner'
import { Code } from '../../blocks/Code'
import { slugField } from '../../fields/slug'
import { preview } from '../../utilities/preview'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidatePost } from './hooks/revalidatePost'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: admins,
    delete: admins,
    read: usersOrPublished,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: (doc: Post) => preview({ path: `/posts/${doc.slug}` }),
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            richText(
              { name: 'content', label: false, required: true },
              {
                features: {
                  blocks: [Banner, Code],
                  link: {
                    enabledCollections: ['pages', 'posts'],
                  },
                },
              },
            ),
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Meta',
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
  },
  versions: {
    drafts: true,
  },
}
