import type { PluginLanguage } from '../types.js'

export const roTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'Cheile API controlează la ce colecții, resurse, instrumente și prompturi pot accesa clienții MCP.',
    apiKeys: 'Chei API',
    authentication: 'Autentificare',
    description: 'Descriere',
    descriptionDescription: 'Descrie scopul cheii API.',
    dismiss: 'Închide',
    keepKeyPrivate: 'Păstrează cheia privată.',
    keyPrivateDescription:
      'Această cheie oferă MCP acces la conținutul tău. Nu o partaja cu alții!',
    lastUsed: 'Ultima utilizare',
    manageAPIKeys: 'Gestionează cheile API',
    mcp: 'MCP',
    noAPIKeys: 'Nu există chei API',
    operations: 'Operațiuni',
    overrideAccess: 'Suprascrie controlul accesului',
    overrideAccessDescription:
      'Când este bifat, această cheie ocolește controlul accesului Payload la fiecare operațiune. Lasă nebifat dacă nu ai un motiv specific.',
    permissions: 'Permisiuni',
    permissionsDescription:
      'Permite clienților MCP să acceseze următoarele colecții, instrumente, resurse și prompturi.',
    prompts: 'Prompturi',
    resources: 'Resurse',
    server: 'Server',
    title: 'Titlu',
    titleDescription: 'O poreclă utilă pentru cheia API.',
    tools: 'Instrumente',
    userDescription: 'Utilizatorul în numele căruia va acționa MCP.',
  },
}

export const ro: PluginLanguage = {
  dateFNSKey: 'ro',
  translations: roTranslations,
}
