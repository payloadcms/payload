import type { CollectionConfig } from 'payload'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { dayField } from '../fields'
import { revalidateVigorAfterChange, revalidateVigorAfterDelete } from '../revalidate'

/**
 * Upcoming events listed on the Vigor website's home page. Separate from the private Events
 * collection under "Business", whose records (clients, notes) must never be public.
 */
export const VigorEvents: CollectionConfig = {
  slug: 'vigor-events',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'date', 'location', '_status'],
    group: 'Vigor website',
    useAsTitle: 'title',
  },
  // Soonest first
  defaultSort: 'date',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      type: 'row',
      fields: [
        dayField(),
        {
          name: 'location',
          type: 'text',
          admin: {
            description: 'e.g. Hong Kong',
          },
          localized: true,
          required: true,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateVigorAfterChange],
    afterDelete: [revalidateVigorAfterDelete],
  },
  labels: {
    plural: 'Events',
    singular: 'Event',
  },
  versions: {
    drafts: true,
  },
}
