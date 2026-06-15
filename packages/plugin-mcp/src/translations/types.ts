import type { Language } from '@payloadcms/translations'

import type { enTranslations } from './languages/en.js'

export type PluginLanguage = Language<{
  'plugin-mcp': {
    apiKeyDescription: string
    apiKeys: string
    authentication: string
    description: string
    descriptionDescription: string
    dismiss: string
    keepKeyPrivate: string
    keyPrivateDescription: string
    lastUsed: string
    manageAPIKeys: string
    mcp: string
    noAPIKeys: string
    operations: string
    overrideAccess: string
    overrideAccessDescription: string
    permissions: string
    permissionsDescription: string
    prompts: string
    resources: string
    server: string
    title: string
    titleDescription: string
    tools: string
    userDescription: string
  }
}>

export type PluginDefaultTranslationsObject = typeof enTranslations
