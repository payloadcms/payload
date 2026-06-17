import type { PluginLanguage } from '../types.js'

export const rsLatinTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API ključevi kontrolišu kojim kolekcijama, resursima, alatima i promptovima MCP klijenti mogu da pristupe.',
    apiKeys: 'API ključevi',
    authentication: 'Autentifikacija',
    description: 'Opis',
    descriptionDescription: 'Opišite svrhu API ključa.',
    dismiss: 'Zatvori',
    keepKeyPrivate: 'Čuvajte ključ privatnim.',
    keyPrivateDescription: 'Ovaj ključ daje MCP-u pristup vašem sadržaju. Ne delite ga sa drugima!',
    lastUsed: 'Poslednji put korišćeno',
    manageAPIKeys: 'Upravljaj API ključevima',
    mcp: 'MCP',
    noAPIKeys: 'Nema API ključeva',
    operations: 'Operacije',
    overrideAccess: 'Zaobiđi kontrolu pristupa',
    overrideAccessDescription:
      'Kada je označeno, ovaj ključ zaobilazi Payload kontrolu pristupa pri svakoj operaciji. Ostavite neoznačeno osim ako imate konkretan razlog.',
    permissions: 'Dozvole',
    permissionsDescription:
      'Dozvolite MCP klijentima pristup sledećim kolekcijama, alatima, resursima i promptovima.',
    prompts: 'Promptovi',
    resources: 'Resursi',
    server: 'Server',
    title: 'Naslov',
    titleDescription: 'Koristan nadimak za API ključ.',
    tools: 'Alati',
    userDescription: 'Korisnik u čije ime će MCP delovati.',
  },
}

export const rsLatin: PluginLanguage = {
  dateFNSKey: 'rs-Latin',
  translations: rsLatinTranslations,
}
