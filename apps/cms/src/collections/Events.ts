import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'
import { locateEvent } from '../hooks/locateEvent'

/**
 * Sales events, exhibitions and trade shows around the world: when, where, and which clients were
 * involved. Internal only: every operation, including reading, requires a logged-in user.
 *
 * The coordinates of each event's place come from Apple Maps when it's saved (../hooks/locateEvent.ts).
 * awoz-api adds the gem, jewellery and raw material trade shows Claude finds on the web every week
 * (../endpoints/appEventDiscovery.ts).
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
  hooks: {
    beforeChange: [locateEvent],
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
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'What the event is about, e.g. "B2B wholesale jewellery trade show"',
      },
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
        {
          type: 'row',
          fields: [
            {
              name: 'coordinates',
              type: 'point',
              admin: {
                description:
                  'Filled in from Apple Maps when the venue, address, city or country changes. Correct them if the pin is in the wrong place; clear them to look the place up again.',
              },
            },
            {
              name: 'coordinatesSource',
              type: 'select',
              admin: {
                description: 'How precise the coordinates are',
                readOnly: true,
              },
              label: 'Coordinates of',
              options: [
                { label: 'The venue (Apple Maps)', value: 'venue' },
                { label: 'The street address (Apple Maps)', value: 'address' },
                { label: 'Only the city (Apple Maps)', value: 'city' },
                { label: 'Only the country (Apple Maps)', value: 'country' },
                { label: 'Set by hand', value: 'manual' },
              ],
            },
          ],
        },
        {
          name: 'coordinatesProblem',
          type: 'text',
          admin: {
            // Only while there is one
            condition: (_data, siblingData) => Boolean(siblingData?.coordinatesProblem),
            readOnly: true,
          },
          label: 'Why there are no coordinates',
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
      name: 'foundBy',
      type: 'select',
      admin: {
        // Only on events awoz-api's weekly search added
        condition: (data) => Boolean(data?.foundBy),
        description:
          "Added by awoz-api's weekly web search; its sources are in the notes. Check the dates and the place.",
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Found by',
      options: [{ label: 'Claude (weekly web search)', value: 'claude' }],
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
