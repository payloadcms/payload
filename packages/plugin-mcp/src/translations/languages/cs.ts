import type { PluginLanguage } from '../types.js'

export const csTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'Klíče API určují, ke kterým kolekcím, zdrojům, nástrojům a promptům mají klienti MCP přístup.',
    apiKeys: 'Klíče API',
    authentication: 'Ověření',
    description: 'Popis',
    descriptionDescription: 'Popište účel klíče API.',
    dismiss: 'Zavřít',
    keepKeyPrivate: 'Udržujte svůj klíč v soukromí.',
    keyPrivateDescription: 'Tento klíč dává MCP přístup k vašemu obsahu. Nesdílejte ho s ostatními!',
    lastUsed: 'Naposledy použito',
    manageAPIKeys: 'Spravovat klíče API',
    mcp: 'MCP',
    noAPIKeys: 'Žádné klíče API',
    operations: 'Operace',
    overrideAccess: 'Přepsat řízení přístupu',
    overrideAccessDescription: 'Je-li zaškrtnuto, tento klíč obejde řízení přístupu Payload při každé operaci. Nechte nezaškrtnuté, pokud k tomu nemáte konkrétní důvod.',
    permissions: 'Oprávnění',
    permissionsDescription: 'Povolte klientům MCP přístup k následujícím kolekcím, nástrojům, zdrojům a promptům.',
    prompts: 'Prompty',
    resources: 'Zdroje',
    server: 'Server',
    title: 'Název',
    titleDescription: 'Užitečná přezdívka pro klíč API.',
    tools: 'Nástroje',
    userDescription: 'Uživatel, za kterého bude MCP jednat.',
  },
}

export const cs: PluginLanguage = {
  dateFNSKey: 'cs',
  translations: csTranslations,
}
