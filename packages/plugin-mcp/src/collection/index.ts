import type { CollectionConfig } from 'payload'

import type { SanitizedMCPPluginConfig } from '../types.js'

import { getAccessField } from './getAccessField.js'

export const getAPIKeysCollection = ({
  pluginConfig,
}: {
  pluginConfig: SanitizedMCPPluginConfig
}): CollectionConfig => {
  const collection: CollectionConfig = {
    slug: 'payload-mcp-api-keys',
    admin: {
      components: {
        views: {
          list: {
            NoResults: '@payloadcms/plugin-mcp/client#APIKeysEmptyState',
          },
        },
      },
      defaultColumns: ['label', 'lastUsed', 'user'],
      // The intro copy renders inside the edit view via `APIKeyField` (per the
      // design) instead of `admin.description`, which would sit in the header.
      // Kept out of the main nav — reachable through the user menu's settings instead.
      group: false,
      useAsTitle: 'label',
    },
    auth: {
      disableLocalStrategy: true,
      useAPIKey: true,
    },
    fields: [
      {
        name: 'apiKeyManager',
        type: 'ui',
        admin: {
          components: { Field: '@payloadcms/plugin-mcp/client#APIKeyField' },
        },
      },
      getAccessField({ pluginConfig }),
      {
        name: 'label',
        type: 'text',
        admin: { description: 'A useful nickname for the API key.', position: 'sidebar' },
        label: 'Title',
      },
      {
        name: 'description',
        type: 'text',
        admin: { description: 'Describe the purpose of the API key.', position: 'sidebar' },
      },
      {
        name: 'lastUsed',
        type: 'date',
        admin: {
          date: { pickerAppearance: 'dayAndTime' },
          position: 'sidebar',
          readOnly: true,
        },
        label: 'Last used',
      },
      {
        name: 'user',
        type: 'relationship',
        admin: { description: 'The user the MCP will act as.', position: 'sidebar' },
        label: 'Owner',
        relationTo: pluginConfig.userCollection,
        required: true,
      },
      {
        name: 'overrideAccess',
        type: 'checkbox',
        admin: {
          description:
            'When checked, this key bypasses Payload access control on every operation it performs. Leave unchecked unless you have a specific reason.',
          position: 'sidebar',
        },
        defaultValue: false,
        label: 'Override access control',
      },
    ],
    labels: {
      plural: 'API Keys',
      singular: 'API Key',
    },
    versions: false,
  }

  return pluginConfig.overrideApiKeyCollection
    ? pluginConfig.overrideApiKeyCollection(collection)
    : collection
}
