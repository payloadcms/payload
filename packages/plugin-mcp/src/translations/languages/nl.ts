import type { PluginLanguage } from '../types.js'

export const nlTranslations = {
  'plugin-mcp': {
    apiKey: 'API-sleutel',
    apiKeyDescription: 'API-sleutels bepalen tot welke collecties, resources, tools en prompts MCP-clients toegang hebben.',
    apiKeys: 'API-sleutels',
    authentication: 'Authenticatie',
    collections: 'Collecties',
    custom: 'Aangepast',
    description: 'Beschrijving',
    descriptionDescription: 'Beschrijf het doel van de API-sleutel.',
    dismiss: 'Sluiten',
    generateAPIKey: 'API-sleutel genereren',
    generateNewKey: 'Nieuwe sleutel genereren',
    globals: 'Globals',
    keepKeyPrivate: 'Houd je sleutel privé.',
    keyPrivateDescription: 'Deze sleutel geeft MCP toegang tot je content. Deel hem niet met anderen!',
    lastUsed: 'Laatst gebruikt',
    manageAPIKeys: 'API-sleutels beheren',
    mcp: 'MCP',
    noAPIKeys: 'Geen API-sleutels',
    operations: 'Bewerkingen',
    overrideAccess: 'Toegangscontrole overschrijven',
    overrideAccessDescription: 'Wanneer ingeschakeld omzeilt deze sleutel Payload-toegangscontrole bij elke bewerking. Laat uitgeschakeld tenzij je een specifieke reden hebt.',
    owner: 'Eigenaar',
    permissions: 'Machtigingen',
    permissionsDescription: 'Sta MCP-clients toe toegang te krijgen tot de volgende collecties, tools, resources en prompts.',
    prompts: 'Prompts',
    resources: 'Resources',
    server: 'Server',
    title: 'Titel',
    titleDescription: 'Een handige bijnaam voor de API-sleutel.',
    tools: 'Tools',
    userDescription: 'De gebruiker namens wie MCP zal handelen.',
  },
}

export const nl: PluginLanguage = {
  dateFNSKey: 'nl',
  translations: nlTranslations,
}
