import type { PluginLanguage } from '../types.js'

export const caTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'Les claus API controlen a quines col·leccions, recursos, eines i prompts poden accedir els clients MCP.',
    apiKeys: 'Claus API',
    authentication: 'Autenticació',
    description: 'Descripció',
    descriptionDescription: 'Descriu el propòsit de la clau API.',
    dismiss: 'Tanca',
    keepKeyPrivate: 'Mantén la clau privada.',
    keyPrivateDescription:
      'Aquesta clau dona a MCP accés al teu contingut. No la comparteixis amb ningú!',
    lastUsed: 'Darrer ús',
    manageAPIKeys: 'Gestiona les claus API',
    mcp: 'MCP',
    noAPIKeys: 'No hi ha claus API',
    operations: 'Operacions',
    overrideAccess: 'Omet el control d’accés',
    overrideAccessDescription:
      'Quan està activat, aquesta clau omet el control d’accés de Payload en cada operació. Deixa-ho desactivat si no tens un motiu concret.',
    permissions: 'Permisos',
    permissionsDescription:
      'Permet que els clients MCP accedeixin a les col·leccions, eines, recursos i prompts següents.',
    prompts: 'Prompts',
    resources: 'Recursos',
    server: 'Servidor',
    title: 'Títol',
    titleDescription: 'Un sobrenom útil per a la clau API.',
    tools: 'Eines',
    userDescription: 'L’usuari en nom del qual actuarà MCP.',
  },
}

export const ca: PluginLanguage = {
  dateFNSKey: 'ca',
  translations: caTranslations,
}
