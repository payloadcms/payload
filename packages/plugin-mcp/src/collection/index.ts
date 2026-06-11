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
      description:
        'API keys control which collections, resources, tools, and prompts MCP clients can access',
      group: 'MCP',
      useAsTitle: 'label',
    },
    auth: {
      disableLocalStrategy: true,
      useAPIKey: true,
    },
    fields: [
      {
        name: 'user',
        type: 'relationship',
        admin: { description: 'The user that the API key is associated with.' },
        relationTo: pluginConfig.userCollection,
        required: true,
      },
      {
        name: 'label',
        type: 'text',
        admin: { description: 'A useful label for the API key.' },
      },
      {
        name: 'description',
        type: 'text',
        admin: { description: 'The purpose of the API key.' },
      },
      {
        name: 'overrideAccess',
        type: 'checkbox',
        admin: {
          description:
            'When checked, this key bypasses Payload access control on every operation it performs. Leave unchecked unless you have a specific reason.',
        },
        defaultValue: false,
        label: 'Override access control',
      },
      getAccessField({ pluginConfig }),
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
