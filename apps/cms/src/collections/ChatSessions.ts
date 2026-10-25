import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/loggedIn'
import { CHAT_RETENTION_DAYS } from './chatRetention'

/**
 * A conversation in the VgemsAI app, saved by its backend (awoz-api) through src/endpoints/appChat.ts.
 * Read-only in the admin panel: the app writes them, the team reads them (and can delete one).
 * Deleted by MongoDB 90 days after its last message (src/collections/chatRetention.ts).
 */
export const ChatSessions: CollectionConfig = {
  slug: 'chat-sessions',
  access: {
    create: () => false,
    delete: loggedIn,
    read: loggedIn,
    update: () => false,
  },
  admin: {
    defaultColumns: ['title', 'client', 'messageCount', 'lastMessageAt'],
    description: `Conversations in the VgemsAI app. Each is deleted ${CHAT_RETENTION_DAYS} days after its last message.`,
    group: 'VgemsAI App',
    listSearchableFields: ['title', 'summary'],
    useAsTitle: 'title',
  },
  defaultSort: '-lastMessageAt',
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'The first question',
      },
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Written by the AI once the conversation has been quiet for 30 minutes',
      },
    },
    {
      name: 'topics',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'messages',
      type: 'join',
      admin: {
        defaultColumns: ['role', 'text', 'createdAt'],
      },
      collection: 'chat-messages',
      defaultLimit: 100,
      defaultSort: 'createdAt',
      on: 'session',
    },
    {
      name: 'client',
      type: 'relationship',
      admin: {
        description: 'Who asked: the client made from their app signup',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'clients',
    },
    {
      name: 'appUserId',
      type: 'number',
      admin: {
        description: 'Their account ID in the app',
        position: 'sidebar',
      },
      index: true,
      label: 'VgemsAI App Account',
      required: true,
    },
    {
      name: 'messageCount',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 0,
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'model',
      type: 'text',
      admin: {
        description: 'The AI model of the last answer',
        position: 'sidebar',
      },
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
    {
      // Set by every new message, cleared once the summary covers it
      name: 'needsSummary',
      type: 'checkbox',
      admin: {
        hidden: true,
      },
      defaultValue: false,
      index: true,
    },
  ],
  labels: {
    plural: 'Chat sessions',
    singular: 'Chat session',
  },
}
