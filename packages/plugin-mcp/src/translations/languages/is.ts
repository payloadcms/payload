import type { PluginLanguage } from '../types.js'

export const isTranslations = {
  'plugin-mcp': {
    apiKey: 'API-lykill',
    apiKeyDescription: 'API-lyklar stjórna hvaða söfnum, tilföngum, verkfærum og promptum MCP-biðlarar geta fengið aðgang að.',
    apiKeys: 'API-lyklar',
    authentication: 'Auðkenning',
    collections: 'Söfn',
    custom: 'Sérsniðið',
    description: 'Lýsing',
    descriptionDescription: 'Lýstu tilgangi API-lykilsins.',
    dismiss: 'Loka',
    generateAPIKey: 'Búa til API-lykil',
    generateNewKey: 'Búa til nýjan lykil',
    globals: 'Víðvær gildi',
    keepKeyPrivate: 'Haltu lyklinum þínum leyndum.',
    keyPrivateDescription: 'Þessi lykill veitir MCP aðgang að efninu þínu. Ekki deila honum með öðrum!',
    lastUsed: 'Síðast notað',
    manageAPIKeys: 'Stjórna API-lyklum',
    mcp: 'MCP',
    noAPIKeys: 'Engir API-lyklar',
    operations: 'Aðgerðir',
    overrideAccess: 'Hunsa aðgangsstýringu',
    overrideAccessDescription: 'Þegar þetta er valið fer lykillinn fram hjá aðgangsstýringu Payload í hverri aðgerð. Láttu þetta vera óvalið nema sérstök ástæða sé fyrir hendi.',
    owner: 'Eigandi',
    permissions: 'Heimildir',
    permissionsDescription: 'Leyfðu MCP-biðlurum aðgang að eftirfarandi söfnum, verkfærum, tilföngum og promptum.',
    prompts: 'Promptar',
    resources: 'Tilföng',
    server: 'Þjónn',
    title: 'Titill',
    titleDescription: 'Gagnlegt viðurnefni fyrir API-lykilinn.',
    tools: 'Verkfæri',
    userDescription: 'Notandinn sem MCP mun starfa sem.',
  },
}

export const is: PluginLanguage = {
  dateFNSKey: 'is',
  translations: isTranslations,
}
