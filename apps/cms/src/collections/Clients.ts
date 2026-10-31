import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'

/**
 * Client records: contact details, type of business and how important the client is.
 * Internal only: every operation, including reading, requires a logged-in user.
 * People who sign up in the VgemsAI app are added as leads by POST /api/app/clients (src/endpoints/appClients.ts).
 */
export const Clients: CollectionConfig = {
  slug: 'clients',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: loggedIn,
    update: loggedIn,
  },
  admin: {
    defaultColumns: [
      'company',
      'contactName',
      'businessType',
      'importance',
      'status',
      'address.country',
    ],
    group: 'Business',
    listSearchableFields: ['company', 'contactName', 'email'],
    useAsTitle: 'company',
  },
  defaultSort: 'company',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'company',
          type: 'text',
          required: true,
        },
        {
          name: 'contactName',
          type: 'text',
          admin: {
            description: 'Main contact person',
          },
        },
        {
          name: 'jobTitle',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'phone',
          type: 'text',
          admin: {
            description: 'With country code, e.g. +852 1234 5678',
          },
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
      name: 'address',
      type: 'group',
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
            },
            {
              name: 'state',
              type: 'text',
              label: 'State / Province',
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'postalCode',
              type: 'text',
              label: 'ZIP / Postal Code',
            },
            {
              name: 'country',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'businessType',
          type: 'select',
          options: [
            { label: 'Retailer', value: 'retailer' },
            { label: 'Wholesaler', value: 'wholesaler' },
            { label: 'Distributor', value: 'distributor' },
            { label: 'Manufacturer', value: 'manufacturer' },
            { label: 'E-commerce', value: 'ecommerce' },
            { label: 'Brand', value: 'brand' },
            { label: 'Agency / Services', value: 'services' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'industry',
          type: 'text',
          admin: {
            description: 'e.g. Jewelry, Fashion, Electronics',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'events',
      type: 'join',
      admin: {
        description: 'Events where you met or worked with this client (set on the event).',
      },
      collection: 'events',
      on: 'clients',
    },
    {
      name: 'chatSessions',
      type: 'join',
      admin: {
        defaultColumns: ['title', 'summary', 'messageCount', 'lastMessageAt'],
        description: 'Their conversations in the VgemsAI app, newest first (kept 90 days).',
      },
      collection: 'chat-sessions',
      defaultSort: '-lastMessageAt',
      label: 'VgemsAI App Chats',
      on: 'client',
    },
    {
      name: 'importance',
      type: 'select',
      admin: {
        description: 'How important this client is to the business',
        position: 'sidebar',
      },
      options: [
        { label: '★★★★★ Critical', value: '5' },
        { label: '★★★★ High', value: '4' },
        { label: '★★★ Medium', value: '3' },
        { label: '★★ Low', value: '2' },
        { label: '★ Minimal', value: '1' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'lead',
      options: [
        { label: 'Lead', value: 'lead' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'How you found them, e.g. a referral or an event',
        position: 'sidebar',
      },
    },
    {
      name: 'appUserId',
      type: 'number',
      admin: {
        description: 'Signed up in the VgemsAI app: the ID of their account there. Set by the app.',
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      label: 'VgemsAI App Account',
    },
  ],
}
