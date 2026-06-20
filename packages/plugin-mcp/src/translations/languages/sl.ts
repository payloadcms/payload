import type { PluginLanguage } from '../types.js'

export const slTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API ključi nadzorujejo, do katerih zbirk, virov, orodij in promptov lahko dostopajo odjemalci MCP.',
    apiKeys: 'API ključi',
    authentication: 'Preverjanje pristnosti',
    confirmRotation: 'Confirm rotation',
    description: 'Opis',
    descriptionDescription: 'Opišite namen API ključa.',
    dismiss: 'Zapri',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Ključ naj ostane zaseben.',
    keyPrivateDescription: 'Ta ključ daje MCP dostop do vaše vsebine. Ne delite ga z drugimi!',
    lastUsed: 'Nazadnje uporabljeno',
    manageAPIKeys: 'Upravljaj API ključe',
    mcp: 'MCP',
    noAPIKeys: 'Ni API ključev',
    operations: 'Operacije',
    overrideAccess: 'Prepiši nadzor dostopa',
    overrideAccessDescription:
      'Ko je označeno, ta ključ obide Payloadov nadzor dostopa pri vsaki operaciji. Pustite neoznačeno, razen če imate poseben razlog.',
    permissions: 'Dovoljenja',
    permissionsDescription:
      'Dovolite odjemalcem MCP dostop do naslednjih zbirk, orodij, virov in promptov.',
    prompts: 'Prompti',
    resources: 'Viri',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Strežnik',
    title: 'Naslov',
    titleDescription: 'Uporaben vzdevek za API ključ.',
    tools: 'Orodja',
    userDescription: 'Uporabnik, v imenu katerega bo MCP deloval.',
  },
}

export const sl: PluginLanguage = {
  dateFNSKey: 'sl-SI',
  translations: slTranslations,
}
