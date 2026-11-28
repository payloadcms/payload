import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'
import { CHAT_RETENTION_DAYS } from './chatRetention'

/**
 * One question or answer of a VgemsAI app conversation (see ChatSessions). Read-only in the admin panel.
 * Deleted by MongoDB 90 days after it was sent (src/collections/chatRetention.ts).
 */
export const ChatMessages: CollectionConfig = {
  slug: 'chat-messages',
  access: {
    create: () => false,
    delete: loggedIn,
    read: loggedIn,
    update: () => false,
  },
  admin: {
    defaultColumns: ['role', 'text', 'session', 'createdAt'],
    description: `Every question and answer in the VgemsAI app, kept ${CHAT_RETENTION_DAYS} days.`,
    group: 'VgemsAI App',
    listSearchableFields: ['text'],
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'session',
      type: 'relationship',
      index: true,
      relationTo: 'chat-sessions',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Question', value: 'user' },
        { label: 'Answer', value: 'assistant' },
      ],
      required: true,
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'refused',
      type: 'checkbox',
      admin: {
        description: 'The AI declined to answer',
      },
      defaultValue: false,
    },
    {
      name: 'appUserId',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      index: true,
      label: 'VgemsAI App Account',
      required: true,
    },
    {
      type: 'collapsible',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'provider',
          type: 'text',
          admin: {
            description: 'claude or openai',
          },
        },
        {
          name: 'model',
          type: 'text',
        },
        {
          name: 'inputTokens',
          type: 'number',
        },
        {
          name: 'outputTokens',
          type: 'number',
        },
        {
          name: 'durationMs',
          type: 'number',
          label: 'Answer time (ms)',
        },
      ],
      label: 'AI',
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
      label: 'Deleted on',
    },
  ],
  labels: {
    plural: 'Chat messages',
    singular: 'Chat message',
  },
}
