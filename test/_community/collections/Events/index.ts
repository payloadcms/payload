import type { CollectionConfig } from 'payload'

import { contentAccess } from '../../access.js'
import { slugField } from '../../fields.js'

export const Events: CollectionConfig = {
  slug: 'events',
  access: contentAccess,
  admin: {
    defaultColumns: ['title', 'startsAt', 'format', 'capacity'],
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField,
    { name: 'description', type: 'textarea' },
    {
      name: 'startsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
      required: true,
    },
    { name: 'format', type: 'radio', defaultValue: 'in-person', options: ['in-person', 'online'] },
    {
      name: 'venue',
      type: 'group',
      admin: { condition: (_, data) => data?.format === 'in-person' },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'address', type: 'text' },
      ],
    },
    {
      name: 'meetingURL',
      type: 'text',
      admin: { condition: (_, data) => data?.format === 'online' },
    },
    { name: 'capacity', type: 'number', defaultValue: 20, min: 1 },
    { name: 'hosts', type: 'relationship', hasMany: true, relationTo: 'authors' },
    { name: 'recommendedGear', type: 'relationship', hasMany: true, relationTo: 'products' },
    { name: 'difficulty', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
  ],
}
