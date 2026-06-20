import type { PluginLanguage } from '../types.js'

export const hrTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API ključevi određuju kojim kolekcijama, resursima, alatima i promptovima MCP klijenti mogu pristupiti.',
    apiKeys: 'API ključevi',
    authentication: 'Autentikacija',
    confirmRotation: 'Confirm rotation',
    description: 'Opis',
    descriptionDescription: 'Opišite svrhu API ključa.',
    dismiss: 'Zatvori',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Čuvajte svoj ključ privatnim.',
    keyPrivateDescription:
      'Ovaj ključ daje MCP-u pristup vašem sadržaju. Nemojte ga dijeliti s drugima!',
    lastUsed: 'Zadnje korišteno',
    manageAPIKeys: 'Upravljanje API ključevima',
    mcp: 'MCP',
    noAPIKeys: 'Nema API ključeva',
    operations: 'Operacije',
    overrideAccess: 'Zaobiđi kontrolu pristupa',
    overrideAccessDescription:
      'Kada je označeno, ovaj ključ zaobilazi Payload kontrolu pristupa pri svakoj operaciji. Ostavite neoznačeno osim ako imate konkretan razlog.',
    permissions: 'Dozvole',
    permissionsDescription:
      'Dopustite MCP klijentima pristup sljedećim kolekcijama, alatima, resursima i promptovima.',
    prompts: 'Promptovi',
    resources: 'Resursi',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Poslužitelj',
    title: 'Naslov',
    titleDescription: 'Koristan nadimak za API ključ.',
    tools: 'Alati',
    userDescription: 'Korisnik u čije će ime MCP djelovati.',
  },
}

export const hr: PluginLanguage = {
  dateFNSKey: 'hr',
  translations: hrTranslations,
}
