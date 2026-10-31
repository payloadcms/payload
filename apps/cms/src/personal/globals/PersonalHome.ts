import type { GlobalConfig } from 'payload'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import {
  buttonField,
  iconField,
  personalWebsiteGroup,
  richTextField,
  seoField,
  typedLinesField,
} from '../fields'

/**
 * The personal website's home page (/). The featured posts come from Posts. Until it's saved, the
 * website shows its own content/index.md.
 */
export const PersonalHome: GlobalConfig = {
  slug: 'personal-home',
  access: {
    read: () => true,
  },
  admin: {
    group: personalWebsiteGroup,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  admin: {
                    description: 'The large heading, e.g. your name.',
                  },
                  required: true,
                },
                {
                  name: 'location',
                  type: 'text',
                  admin: {
                    description: 'e.g. Based in New York',
                  },
                },
              ],
            },
            typedLinesField({
              name: 'roles',
              description:
                'Typed out under the name, one after another, e.g. Software Engineer. Press Enter after each.',
              label: 'Job titles',
            }),
            richTextField({ name: 'intro', label: 'Introduction' }),
            {
              name: 'photo',
              type: 'upload',
              admin: {
                description: 'Optional. Shown above the name.',
              },
              relationTo: 'media',
            },
            buttonField({
              description:
                'Shown below the introduction, e.g. "Download Resume" with your resume as the file.',
            }),
          ],
          label: 'Introduction',
        },
        {
          fields: [
            {
              name: 'achievements',
              type: 'array',
              admin: {
                description: 'Key figures, shown four in a row on large screens.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'number',
                      type: 'text',
                      admin: {
                        description: 'e.g. 10+',
                      },
                      required: true,
                    },
                    {
                      name: 'text',
                      type: 'text',
                      admin: {
                        description: 'e.g. Years of experience',
                      },
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              name: 'featuredPosts',
              type: 'group',
              admin: {
                description: 'Lists the newest posts that have Featured ticked.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      admin: {
                        description: 'e.g. Featured Articles',
                      },
                    },
                    {
                      name: 'limit',
                      type: 'number',
                      admin: {
                        description: 'How many posts to show.',
                      },
                      defaultValue: 6,
                      max: 24,
                      min: 1,
                      required: true,
                    },
                  ],
                },
                {
                  name: 'text',
                  type: 'textarea',
                },
              ],
              label: 'Featured posts',
            },
            {
              name: 'expertise',
              type: 'group',
              admin: {
                description: 'A row of logos at the bottom of the page, on larger screens only.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: 'e.g. Expert In',
                  },
                },
                {
                  name: 'logos',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'name',
                          type: 'text',
                          admin: {
                            description: 'e.g. Node.js',
                          },
                          required: true,
                        },
                        iconField({ name: 'logo', required: true }),
                      ],
                    },
                  ],
                  labels: {
                    plural: 'Logos',
                    singular: 'Logo',
                  },
                },
              ],
            },
          ],
          label: 'Highlights',
        },
        {
          fields: [seoField],
          label: 'SEO',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Home page',
}
