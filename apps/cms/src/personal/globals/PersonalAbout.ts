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
 * The personal website's About page (/about). Until it's saved, the website shows content/about.md.
 */
export const PersonalAbout: GlobalConfig = {
  slug: 'personal-about',
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
              name: 'name',
              type: 'text',
              admin: {
                description: 'Shown at the top of the photo.',
              },
              required: true,
            },
            {
              name: 'photo',
              type: 'upload',
              admin: {
                description: 'A portrait, shown in black and white next to the text.',
              },
              relationTo: 'media',
            },
            {
              name: 'sections',
              type: 'array',
              admin: {
                description: 'Numbered automatically: 01., 02., …',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: 'e.g. Interests and Hobbies',
                  },
                  required: true,
                },
                richTextField({ name: 'text', required: true }),
              ],
              labels: {
                plural: 'Sections',
                singular: 'Section',
              },
            },
            {
              name: 'cta',
              type: 'group',
              admin: {
                description: 'Shown at the bottom of the photo.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: 'e.g. Ready to discuss your project?',
                  },
                },
                {
                  name: 'text',
                  type: 'textarea',
                },
                buttonField(),
              ],
              label: 'Call to action',
            },
          ],
          label: 'About me',
        },
        {
          fields: [
            {
              name: 'specialties',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: "e.g. I'm Specialized in",
                  },
                },
                typedLinesField({
                  name: 'lines',
                  description:
                    'Typed out below the title, one after another, e.g. Back-End Development. Press Enter after each.',
                }),
              ],
              label: 'Specialized in',
            },
            {
              name: 'skillSets',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: 'e.g. Back-End Development',
                  },
                  required: true,
                },
                {
                  name: 'skills',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'name',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'level',
                          type: 'number',
                          admin: {
                            description: '1 (basic) to 5 (expert)',
                          },
                          max: 5,
                          min: 1,
                          required: true,
                        },
                        iconField(),
                      ],
                    },
                  ],
                },
              ],
              labels: {
                plural: 'Skill sets',
                singular: 'Skill set',
              },
            },
          ],
          label: 'Skills',
        },
        {
          fields: [
            {
              name: 'history',
              type: 'array',
              admin: {
                description:
                  'Lists shown side by side at the bottom of the page, e.g. Employment and Education.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  admin: {
                    description: 'e.g. Employment',
                  },
                  required: true,
                },
                {
                  name: 'entries',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'name',
                          type: 'text',
                          admin: {
                            description: 'e.g. the company or school',
                          },
                          required: true,
                        },
                        {
                          name: 'description',
                          type: 'text',
                          admin: {
                            description: 'e.g. the role or degree',
                          },
                        },
                        {
                          name: 'period',
                          type: 'text',
                          admin: {
                            description: 'e.g. 2017-2023',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
              labels: {
                plural: 'Lists',
                singular: 'List',
              },
            },
          ],
          label: 'History',
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
  label: 'About page',
}
