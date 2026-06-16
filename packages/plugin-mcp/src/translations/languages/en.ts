import type { PluginLanguage } from '../types.js'

export const enTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'API keys control which collections, resources, tools, and prompts MCP clients can access.',
    apiKeys: 'API Keys',
    authentication: 'Authentication',
    description: 'Description',
    descriptionDescription: 'Describe the purpose of the API key.',
    dismiss: 'Dismiss',
    keepKeyPrivate: 'Keep your key private.',
    keyPrivateDescription: 'This key is what gives MCP access to your content. Don’t share it with others!',
    lastUsed: 'Last used',
    manageAPIKeys: 'Manage API keys',
    mcp: 'MCP',
    noAPIKeys: 'No API Keys',
    operations: 'Operations',
    overrideAccess: 'Override access control',
    overrideAccessDescription: 'When checked, this key bypasses Payload access control on every operation it performs. Leave unchecked unless you have a specific reason.',
    permissions: 'Permissions',
    permissionsDescription: 'Allow MCP clients to access the following collections, tools, resources, and prompts.',
    prompts: 'Prompts',
    resources: 'Resources',
    server: 'Server',
    title: 'Title',
    titleDescription: 'A useful nickname for the API key.',
    tools: 'Tools',
    userDescription: 'The user the MCP will act as.',
  },
}

export const en: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: enTranslations,
}
