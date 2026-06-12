import type { CollectionConfig } from 'payload'

import { createAPIKeyFields } from 'payload'

import type { SanitizedMCPPluginConfig } from '../types.js'

import { getAccessField } from './getAccessField.js'

const apiKeyStorageFields = createAPIKeyFields({
  apiKeyField: {
    admin: {
      components: { Field: '@payloadcms/plugin-mcp/client#APIKeyField' },
    },
    required: true,
  },
  apiKeyIndexField: {
    index: true,
    required: true,
  },
  includeEnableAPIKey: false,
})

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
      // Kept out of the main nav — reachable through the user menu's settings instead.
      group: false,
      useAsTitle: 'label',
    },
    fields: [
      ...apiKeyStorageFields,
      getAccessField({ pluginConfig }),
      {
        name: 'label',
        type: 'text',
        admin: {
          description: ({ t }) => t('plugin-mcp:titleDescription'),
          position: 'sidebar',
        },
        label: ({ t }) => t('plugin-mcp:title'),
      },
      {
        name: 'description',
        type: 'text',
        admin: {
          description: ({ t }) => t('plugin-mcp:descriptionDescription'),
          position: 'sidebar',
        },
        label: ({ t }) => t('plugin-mcp:description'),
      },
      {
        name: 'lastUsed',
        type: 'date',
        admin: {
          condition: (_, _siblingData, { operation }) => operation !== 'create',
          date: { pickerAppearance: 'dayAndTime' },
          position: 'sidebar',
        },
        label: ({ t }) => t('plugin-mcp:lastUsed'),
      },
      {
        name: 'user',
        type: 'relationship',
        admin: {
          description: ({ t }) => t('plugin-mcp:userDescription'),
          position: 'sidebar',
        },
        label: ({ t }) => t('plugin-mcp:owner'),
        relationTo: pluginConfig.userCollection,
        required: true,
      },
      {
        name: 'overrideAccess',
        type: 'checkbox',
        admin: {
          description: ({ t }) => t('plugin-mcp:overrideAccessDescription'),
          position: 'sidebar',
        },
        defaultValue: false,
        label: ({ t }) => t('plugin-mcp:overrideAccess'),
      },
    ],
    labels: {
      plural: ({ t }) => t('plugin-mcp:apiKeys'),
      singular: ({ t }) => t('plugin-mcp:apiKey'),
    },
    versions: false,
  }

  return pluginConfig.overrideApiKeyCollection
    ? pluginConfig.overrideApiKeyCollection(collection)
    : collection
}
