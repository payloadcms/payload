import type { PluginLanguage } from '../types.js'

export const nbTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API-nøkler styrer hvilke samlinger, ressurser, verktøy og prompter MCP-klienter kan få tilgang til.',
    apiKeys: 'API-nøkler',
    authentication: 'Autentisering',
    confirmRotation: 'Confirm rotation',
    description: 'Beskrivelse',
    descriptionDescription: 'Beskriv formålet med API-nøkkelen.',
    dismiss: 'Lukk',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Hold nøkkelen din privat.',
    keyPrivateDescription:
      'Denne nøkkelen gir MCP tilgang til innholdet ditt. Ikke del den med andre!',
    lastUsed: 'Sist brukt',
    manageAPIKeys: 'Administrer API-nøkler',
    mcp: 'MCP',
    noAPIKeys: 'Ingen API-nøkler',
    operations: 'Operasjoner',
    overrideAccess: 'Overstyr tilgangskontroll',
    overrideAccessDescription:
      'Når dette er valgt, omgår nøkkelen Payloads tilgangskontroll for hver operasjon. La være av med mindre du har en konkret grunn.',
    permissions: 'Tillatelser',
    permissionsDescription:
      'Tillat MCP-klienter tilgang til følgende samlinger, verktøy, ressurser og prompter.',
    prompts: 'Prompter',
    resources: 'Ressurser',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Server',
    title: 'Tittel',
    titleDescription: 'Et nyttig kallenavn for API-nøkkelen.',
    tools: 'Verktøy',
    userDescription: 'Brukeren MCP vil opptre som.',
  },
}

export const nb: PluginLanguage = {
  dateFNSKey: 'nb',
  translations: nbTranslations,
}
