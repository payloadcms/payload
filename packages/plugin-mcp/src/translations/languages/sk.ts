import type { PluginLanguage } from '../types.js'

export const skTranslations = {
  'plugin-mcp': {
    apiKey: 'Kľúč API',
    apiKeyDescription: 'Kľúče API určujú, ku ktorým kolekciám, zdrojom, nástrojom a promptom majú klienti MCP prístup.',
    apiKeys: 'Kľúče API',
    authentication: 'Overenie',
    collections: 'Kolekcie',
    custom: 'Vlastné',
    description: 'Popis',
    descriptionDescription: 'Opíšte účel kľúča API.',
    dismiss: 'Zavrieť',
    generateAPIKey: 'Vygenerovať kľúč API',
    generateNewKey: 'Vygenerovať nový kľúč',
    globals: 'Globálne položky',
    keepKeyPrivate: 'Udržujte svoj kľúč v súkromí.',
    keyPrivateDescription: 'Tento kľúč dáva MCP prístup k vášmu obsahu. Nezdieľajte ho s ostatnými!',
    lastUsed: 'Naposledy použité',
    manageAPIKeys: 'Spravovať kľúče API',
    mcp: 'MCP',
    noAPIKeys: 'Žiadne kľúče API',
    operations: 'Operácie',
    owner: 'Vlastník',
    overrideAccess: 'Prepísať riadenie prístupu',
    overrideAccessDescription: 'Ak je zaškrtnuté, tento kľúč obíde riadenie prístupu Payload pri každej operácii. Nechajte nezaškrtnuté, pokiaľ nemáte konkrétny dôvod.',
    permissions: 'Oprávnenia',
    permissionsDescription: 'Povoľte klientom MCP prístup k nasledujúcim kolekciám, nástrojom, zdrojom a promptom.',
    prompts: 'Prompty',
    resources: 'Zdroje',
    server: 'Server',
    title: 'Názov',
    titleDescription: 'Užitočná prezývka pre kľúč API.',
    tools: 'Nástroje',
    userDescription: 'Používateľ, za ktorého bude MCP konať.',
  },
}

export const sk: PluginLanguage = {
  dateFNSKey: 'sk',
  translations: skTranslations,
}
