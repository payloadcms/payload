import type { CollectionConfig, Field } from 'payload'

import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'

/** A month-and-year date, e.g. for jobs and studies */
const monthField = ({ name, description }: { description?: string; name: string }): Field => ({
  name,
  type: 'date',
  admin: {
    date: {
      displayFormat: 'MMM yyyy',
      pickerAppearance: 'monthOnly',
    },
    description,
  },
})

/**
 * Profiles of people (e.g. you on the About page): who they are, where to find them, their skills,
 * work history and education. Read through `GET /api/profiles`; only published profiles are
 * visible without logging in, and the email address only to logged-in users.
 */
export const Profiles: CollectionConfig = {
  slug: 'profiles',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['name', 'headline', 'location', '_status'],
    useAsTitle: 'name',
  },
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
          name: 'headline',
          type: 'text',
          admin: {
            description: 'e.g. Software Engineer',
          },
        },
      ],
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'links',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      defaultValue: 'website',
                      options: [
                        { label: 'GitHub', value: 'github' },
                        { label: 'LinkedIn', value: 'linkedin' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'X', value: 'x' },
                        { label: 'Website', value: 'website' },
                        { label: 'Other', value: 'other' },
                      ],
                      required: true,
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: 'URL',
                      required: true,
                      validate: (value: null | string | undefined) =>
                        /^https?:\/\/\S+$/.test(value || '') || 'Enter a full URL, e.g. https://…',
                    },
                  ],
                },
              ],
              labels: {
                plural: 'Links',
                singular: 'Link',
              },
            },
          ],
          label: 'Links',
        },
        {
          fields: [
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
                      name: 'category',
                      type: 'text',
                      admin: {
                        description: 'e.g. Back-End Development',
                      },
                    },
                    {
                      name: 'level',
                      type: 'number',
                      admin: {
                        description: '1 (basic) to 5 (expert)',
                      },
                      max: 5,
                      min: 1,
                    },
                  ],
                },
              ],
            },
          ],
          label: 'Skills',
        },
        {
          fields: [
            {
              name: 'experience',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'organization',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'role',
                      type: 'text',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    monthField({ name: 'startDate' }),
                    monthField({ name: 'endDate', description: 'Leave empty if current' }),
                  ],
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
            {
              name: 'education',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'institution',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'qualification',
                      type: 'text',
                      admin: {
                        description: 'e.g. BSc (Business Administration)',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    monthField({ name: 'startDate' }),
                    monthField({ name: 'endDate', description: 'Leave empty if current' }),
                  ],
                },
              ],
            },
          ],
          label: 'History',
        },
      ],
    },
    {
      name: 'slug',
      type: 'slug',
      useAsSlug: 'name',
    },
    {
      name: 'email',
      type: 'email',
      access: {
        // Contact details stay private to the admin panel
        read: ({ req }) => Boolean(req.user),
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'e.g. New York',
        position: 'sidebar',
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
