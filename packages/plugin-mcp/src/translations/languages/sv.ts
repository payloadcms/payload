import type { PluginLanguage } from '../types.js'

export const svTranslations = {
  'plugin-mcp': {
    apiKey: 'API-nyckel',
    apiKeyDescription: 'API-nycklar styr vilka samlingar, resurser, verktyg och prompter MCP-klienter kan komma åt.',
    apiKeys: 'API-nycklar',
    authentication: 'Autentisering',
    collections: 'Samlingar',
    custom: 'Anpassat',
    description: 'Beskrivning',
    descriptionDescription: 'Beskriv syftet med API-nyckeln.',
    dismiss: 'Stäng',
    generateAPIKey: 'Generera API-nyckel',
    generateNewKey: 'Generera ny nyckel',
    globals: 'Globala',
    keepKeyPrivate: 'Håll din nyckel privat.',
    keyPrivateDescription: 'Den här nyckeln ger MCP åtkomst till ditt innehåll. Dela den inte med andra!',
    lastUsed: 'Senast använd',
    manageAPIKeys: 'Hantera API-nycklar',
    mcp: 'MCP',
    noAPIKeys: 'Inga API-nycklar',
    operations: 'Åtgärder',
    owner: 'Ägare',
    overrideAccess: 'Åsidosätt åtkomstkontroll',
    overrideAccessDescription: 'När detta är markerat kringgår nyckeln Payloads åtkomstkontroll för varje åtgärd. Lämna avmarkerat om du inte har en specifik anledning.',
    permissions: 'Behörigheter',
    permissionsDescription: 'Tillåt MCP-klienter att komma åt följande samlingar, verktyg, resurser och prompter.',
    prompts: 'Prompter',
    resources: 'Resurser',
    server: 'Server',
    title: 'Titel',
    titleDescription: 'Ett användbart smeknamn för API-nyckeln.',
    tools: 'Verktyg',
    userDescription: 'Användaren som MCP kommer att agera som.',
  },
}

export const sv: PluginLanguage = {
  dateFNSKey: 'sv',
  translations: svTranslations,
}
