import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'

/**
 * Sales events, exhibitions and trade shows around the world: when, where, and which clients were
 * involved. Internal only: every operation, including reading, requires a logged-in user.
 */
export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: loggedIn,
    update: loggedIn,
  },
  admin: {
    defaultColumns: ['name', 'type', 'startDate', 'location.city', 'location.country', 'status'],
    group: 'Business',
    listSearchableFields: ['name', 'organizer', 'location.city', 'location.country'],
    useAsTitle: 'name',
  },
  // Most recent first
  defaultSort: '-startDate',
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
          name: 'type',
          type: 'select',
          defaultValue: 'exhibition',
          options: [
            { label: 'Exhibition', value: 'exhibition' },
            { label: 'Trade show', value: 'tradeShow' },
            { label: 'Sales event', value: 'salesEvent' },
            { label: 'Conference', value: 'conference' },
            { label: 'Meeting', value: 'meeting' },
            { label: 'Other', value: 'other' },
          ],
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
          required: true,
          // Stores the event's time zone next to the date (startDate_tz)
          timezone: true,
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'Leave empty for a single-day event',
          },
          timezone: true,
          validate: (value: Date | null | string | undefined, { siblingData }) => {
            const start = (siblingData as { startDate?: Date | string })?.startDate

            return !value || !start || new Date(value) >= new Date(start)
              ? true
              : 'The end date must be on or after the start date.'
          },
        },
      ],
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'venue',
              type: 'text',
              admin: {
                description: 'e.g. Hong Kong Convention and Exhibition Centre',
              },
            },
            {
              name: 'booth',
              type: 'text',
              admin: {
                description: 'Hall / booth number',
              },
            },
          ],
        },
        {
          name: 'address',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              required: true,
            },
            {
              name: 'country',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'organizer',
          type: 'text',
        },
        {
          name: 'website',
          type: 'text',
          validate: (value: null | string | undefined) =>
            !value || /^https?:\/\/\S+$/.test(value) || 'Enter a full URL, e.g. https://…',
        },
      ],
    },
    {
      name: 'clients',
      type: 'relationship',
      admin: {
        description: 'Clients you met or worked with at this event',
      },
      hasMany: true,
      relationTo: 'clients',
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Results, leads, follow-ups',
      },
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'planned',
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
    },
    {
      name: 'attachments',
      type: 'upload',
      admin: {
        description: 'Brochures, floor plans, photos',
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'media',
    },
  ],
}
