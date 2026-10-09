import type { GlobalConfig } from 'payload'

import { text, textarea } from 'payload/shared'

import { bodyField, requiredInEnglish } from '../fields'
import { revalidateVigorGlobal } from '../revalidate'

/** The Vigor website's About Us page (/about) */
export const VigorAbout: GlobalConfig = {
  slug: 'vigor-about',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Vigor website',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      validate: requiredInEnglish(text),
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      admin: {
        description: 'Banner photo, at least 1600 × 600 pixels.',
      },
      relationTo: 'media',
    },
    bodyField,
    {
      name: 'values',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
          validate: requiredInEnglish(text),
        },
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: true,
          validate: requiredInEnglish(textarea),
        },
      ],
    },
    {
      name: 'milestones',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'year',
              type: 'text',
              admin: {
                width: '20%',
              },
              required: true,
            },
            {
              name: 'text',
              type: 'text',
              localized: true,
              required: true,
              validate: requiredInEnglish(text),
            },
          ],
        },
      ],
    },
    {
      name: 'teams',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          localized: true,
          required: true,
          validate: requiredInEnglish(text),
        },
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: true,
          validate: requiredInEnglish(textarea),
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateVigorGlobal],
  },
  label: 'About page',
}
