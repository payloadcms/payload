import type { PluginLanguage } from '../types.js'

export const deTranslations = {
  'plugin-mcp': {
    apiKey: 'API-Schlüssel',
    apiKeyDescription: 'API-Schlüssel steuern, auf welche Collections, Ressourcen, Tools und Prompts MCP-Clients zugreifen können.',
    apiKeys: 'API-Schlüssel',
    authentication: 'Authentifizierung',
    collections: 'Collections',
    custom: 'Benutzerdefiniert',
    description: 'Beschreibung',
    descriptionDescription: 'Beschreibe den Zweck des API-Schlüssels.',
    dismiss: 'Schließen',
    generateAPIKey: 'API-Schlüssel generieren',
    generateNewKey: 'Neuen Schlüssel generieren',
    globals: 'Globals',
    keepKeyPrivate: 'Halte deinen Schlüssel geheim.',
    keyPrivateDescription: 'Dieser Schlüssel gibt MCP Zugriff auf deine Inhalte. Teile ihn nicht mit anderen!',
    lastUsed: 'Zuletzt verwendet',
    manageAPIKeys: 'API-Schlüssel verwalten',
    mcp: 'MCP',
    noAPIKeys: 'Keine API-Schlüssel',
    operations: 'Operationen',
    overrideAccess: 'Zugriffskontrolle überschreiben',
    overrideAccessDescription: 'Wenn aktiviert, umgeht dieser Schlüssel bei jeder ausgeführten Operation die Payload-Zugriffsregeln. Nur aktivieren, wenn es einen konkreten Grund gibt.',
    owner: 'Eigentümer',
    permissions: 'Berechtigungen',
    permissionsDescription: 'Erlaube MCP-Clients Zugriff auf die folgenden Collections, Tools, Ressourcen und Prompts.',
    prompts: 'Prompts',
    resources: 'Ressourcen',
    server: 'Server',
    title: 'Titel',
    titleDescription: 'Ein hilfreicher Anzeigename für den API-Schlüssel.',
    tools: 'Tools',
    userDescription: 'Der Benutzer, als den MCP handeln wird.',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
