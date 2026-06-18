import type { PluginLanguage } from '../types.js'

export const itTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'Le chiavi API controllano a quali raccolte, risorse, strumenti e prompt possono accedere i client MCP.',
    apiKeys: 'Chiavi API',
    authentication: 'Autenticazione',
    description: 'Descrizione',
    descriptionDescription: 'Descrivi lo scopo della chiave API.',
    dismiss: 'Chiudi',
    keepKeyPrivate: 'Mantieni privata la tua chiave.',
    keyPrivateDescription:
      'Questa chiave dà a MCP accesso ai tuoi contenuti. Non condividerla con altri!',
    lastUsed: 'Ultimo utilizzo',
    manageAPIKeys: 'Gestisci chiavi API',
    mcp: 'MCP',
    noAPIKeys: 'Nessuna chiave API',
    operations: 'Operazioni',
    overrideAccess: 'Ignora controllo accessi',
    overrideAccessDescription:
      'Quando selezionato, questa chiave ignora il controllo accessi di Payload in ogni operazione. Lascialo deselezionato salvo un motivo specifico.',
    permissions: 'Permessi',
    permissionsDescription:
      'Consenti ai client MCP di accedere alle seguenti raccolte, strumenti, risorse e prompt.',
    prompts: 'Prompt',
    resources: 'Risorse',
    server: 'Server',
    title: 'Titolo',
    titleDescription: 'Un nome utile per la chiave API.',
    tools: 'Strumenti',
    userDescription: 'L’utente per conto del quale agirà MCP.',
  },
}

export const it: PluginLanguage = {
  dateFNSKey: 'it',
  translations: itTranslations,
}
