import type { PluginLanguage } from '../types.js'

export const daTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API-nøgler styrer, hvilke samlinger, ressourcer, værktøjer og prompts MCP-klienter kan få adgang til.',
    apiKeys: 'API-nøgler',
    authentication: 'Godkendelse',
    confirmRotation: 'Confirm rotation',
    description: 'Beskrivelse',
    descriptionDescription: 'Beskriv formålet med API-nøglen.',
    dismiss: 'Luk',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Hold din nøgle privat.',
    keyPrivateDescription: 'Denne nøgle giver MCP adgang til dit indhold. Del den ikke med andre!',
    lastUsed: 'Sidst brugt',
    manageAPIKeys: 'Administrer API-nøgler',
    mcp: 'MCP',
    noAPIKeys: 'Ingen API-nøgler',
    operations: 'Handlinger',
    overrideAccess: 'Tilsidesæt adgangskontrol',
    overrideAccessDescription:
      'Når dette er markeret, omgår nøglen Payloads adgangskontrol for hver handling. Lad det være umarkeret, medmindre du har en specifik grund.',
    permissions: 'Tilladelser',
    permissionsDescription:
      'Tillad MCP-klienter adgang til følgende samlinger, værktøjer, ressourcer og prompts.',
    prompts: 'Prompts',
    resources: 'Ressourcer',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Server',
    title: 'Titel',
    titleDescription: 'Et nyttigt kaldenavn til API-nøglen.',
    tools: 'Værktøjer',
    userDescription: 'Brugeren som MCP handler som.',
  },
}

export const da: PluginLanguage = {
  dateFNSKey: 'da',
  translations: daTranslations,
}
