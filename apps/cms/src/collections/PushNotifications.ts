import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { ValidationError } from 'payload'

import { loggedIn } from '../access/loggedIn'

/**
 * Push notifications to the VgemsAI app. The team writes one here and chooses when it goes out; awoz-api checks
 * every minute for the ones due (src/endpoints/appPushNotifications.ts), sends them through Firebase to the
 * devices it keeps in MySQL, and writes back how many arrived. Deleting one that hasn't gone out yet cancels it.
 */
export const PushNotifications: CollectionConfig = {
  slug: 'push-notifications',
  access: {
    create: loggedIn,
    delete: loggedIn,
    read: loggedIn,
    update: loggedIn,
  },
  admin: {
    defaultColumns: ['title', 'audience', 'status', 'sendAt', 'results.delivered'],
    description:
      'Notifications on the phones of VgemsAI app users. Choose "Now" or a time under Send, and save: it goes out within a minute of that time.',
    group: 'VgemsAI App',
    useAsTitle: 'title',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'In bold on the notification, e.g. "New trade show added"',
      },
      maxLength: 100,
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Message',
      maxLength: 500,
      required: true,
    },
    {
      name: 'screen',
      type: 'select',
      admin: {
        description: 'The tab the app opens when the notification is tapped',
      },
      defaultValue: 'home',
      label: 'Opens',
      options: [
        { label: 'Home', value: 'home' },
        { label: 'Events', value: 'events' },
        { label: 'Products', value: 'products' },
        { label: 'Research', value: 'research' },
        { label: 'Settings', value: 'settings' },
      ],
      required: true,
    },
    {
      name: 'audience',
      type: 'radio',
      defaultValue: 'everyone',
      label: 'To',
      options: [
        { label: 'Everyone with the app', value: 'everyone' },
        { label: 'Chosen clients', value: 'clients' },
      ],
      required: true,
    },
    {
      name: 'clients',
      type: 'relationship',
      admin: {
        condition: (_data, siblingData) => siblingData?.audience === 'clients',
        description:
          'Only clients who signed up in the app (with a VgemsAI App Account) can get it, on the phones they are signed in on with notifications on.',
      },
      // Clients without an app account have no phone to send to
      filterOptions: { appUserId: { exists: true } },
      hasMany: true,
      relationTo: 'clients',
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        siblingData?.audience !== 'clients' ||
        (Array.isArray(value) && value.length > 0) ||
        'Choose at least one client.',
    },
    {
      name: 'delivery',
      type: 'radio',
      defaultValue: 'draft',
      hooks: {
        // A copy of a sent notification waits until someone chooses to send it
        beforeDuplicate: [() => 'draft'],
      },
      label: 'Send',
      options: [
        { label: 'Not yet (draft)', value: 'draft' },
        { label: 'Now', value: 'now' },
        { label: 'At a set time', value: 'scheduled' },
      ],
      required: true,
    },
    {
      name: 'sendAt',
      type: 'date',
      admin: {
        condition: (_data, siblingData) => siblingData?.delivery === 'scheduled',
        date: { pickerAppearance: 'dayAndTime' },
      },
      label: 'Send at',
      // Stores the time zone it was picked in next to it (sendAt_tz)
      timezone: true,
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        siblingData?.delivery !== 'scheduled' || Boolean(value) || 'Choose when to send it.',
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Waiting to send', value: 'queued' },
        { label: 'Sending', value: 'sending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      required: true,
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        condition: (data) => Boolean(data?.sentAt),
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Sent at',
    },
    {
      name: 'results',
      type: 'group',
      admin: {
        condition: (data) => data?.status === 'sent' || data?.status === 'failed',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'devices',
          type: 'number',
          admin: { description: 'Phones it was sent to', readOnly: true },
        },
        {
          name: 'delivered',
          type: 'number',
          admin: { description: 'Accepted by Firebase', readOnly: true },
        },
        {
          name: 'failed',
          type: 'number',
          admin: { description: 'Not accepted, e.g. Firebase was busy', readOnly: true },
        },
        {
          name: 'removed',
          type: 'number',
          admin: {
            description: 'Phones that no longer have the app or notifications: never sent to again',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'problem',
      type: 'text',
      admin: {
        condition: (data) => Boolean(data?.problem),
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Why it failed',
    },
  ],
  hooks: {
    beforeChange: [
      (({ context, data, operation, originalDoc, req }) => {
        // awoz-api's progress (src/endpoints/appPushNotifications.ts)
        if (context.pushProgress) {
          return data
        }

        // A copy (Duplicate) gets the original as originalDoc too, but is a new notification
        const status =
          operation === 'update' ? (originalDoc as { status?: string } | undefined)?.status : null

        if (status === 'sending' || status === 'sent') {
          throw new ValidationError({
            collection: 'push-notifications',
            errors: [
              {
                message:
                  'This notification has gone out and can no longer be changed. Duplicate it to send it again.',
                path: 'delivery',
              },
            ],
            req,
          })
        }

        const delivery = data.delivery ?? (operation === 'update' ? originalDoc?.delivery : null)

        // Results of an earlier try (a failed one, or the original of a copy) go
        const fresh = {
          ...data,
          problem: null,
          results: { delivered: null, devices: null, failed: null, removed: null },
          sentAt: null,
        }

        if (delivery !== 'now' && delivery !== 'scheduled') {
          return { ...fresh, status: 'draft' }
        }

        return {
          ...fresh,
          sendAt: delivery === 'now' ? new Date().toISOString() : data.sendAt,
          status: 'queued',
        }
      }) satisfies CollectionBeforeChangeHook,
    ],
  },
  labels: {
    plural: 'Push notifications',
    singular: 'Push notification',
  },
}
