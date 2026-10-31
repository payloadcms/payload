import type { GlobalConfig } from 'payload'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import { personalWebsiteGroup, seoField } from '../fields'

/**
 * The texts of the personal website's blog (/blog): the post list and the categories next to the
 * newsletter. The posts are under Posts. Until it's saved, the website shows content/blog.md.
 */
export const PersonalBlogPage: GlobalConfig = {
  slug: 'personal-blog-page',
  access: {
    read: () => true,
  },
  admin: {
    description: 'The posts themselves are under Posts.',
    group: personalWebsiteGroup,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Above the post list, e.g. Latest Articles',
          },
          required: true,
        },
        {
          name: 'text',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'categories',
      type: 'group',
      admin: {
        description: 'The tags that have a tag page in the website repo (content/tags).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: {
                description: 'e.g. Categories',
              },
            },
            {
              name: 'text',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    seoField,
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Blog page',
}
