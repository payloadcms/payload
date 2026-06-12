import type { PluginLanguage } from '../types.js'

export const slTranslations = {
  'plugin-mcp': {
    apiKey: 'API ključ',
    apiKeyDescription: 'API ključi nadzorujejo, do katerih zbirk, virov, orodij in promptov lahko dostopajo odjemalci MCP.',
    apiKeys: 'API ključi',
    authentication: 'Preverjanje pristnosti',
    collections: 'Zbirke',
    custom: 'Po meri',
    description: 'Opis',
    descriptionDescription: 'Opišite namen API ključa.',
    dismiss: 'Zapri',
    generateAPIKey: 'Ustvari API ključ',
    generateNewKey: 'Ustvari nov ključ',
    globals: 'Globali',
    keepKeyPrivate: 'Ključ naj ostane zaseben.',
    keyPrivateDescription: 'Ta ključ daje MCP dostop do vaše vsebine. Ne delite ga z drugimi!',
    lastUsed: 'Nazadnje uporabljeno',
    manageAPIKeys: 'Upravljaj API ključe',
    mcp: 'MCP',
    noAPIKeys: 'Ni API ključev',
    operations: 'Operacije',
    overrideAccess: 'Prepiši nadzor dostopa',
    overrideAccessDescription: 'Ko je označeno, ta ključ obide Payloadov nadzor dostopa pri vsaki operaciji. Pustite neoznačeno, razen če imate poseben razlog.',
    owner: 'Lastnik',
    permissions: 'Dovoljenja',
    permissionsDescription: 'Dovolite odjemalcem MCP dostop do naslednjih zbirk, orodij, virov in promptov.',
    prompts: 'Prompti',
    resources: 'Viri',
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
