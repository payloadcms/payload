import type { PluginLanguage } from '../types.js'

export const frTranslations = {
  'plugin-mcp': {
    apiKey: 'Clé API',
    apiKeyDescription: 'Les clés API contrôlent les collections, ressources, outils et prompts auxquels les clients MCP peuvent accéder.',
    apiKeys: 'Clés API',
    authentication: 'Authentification',
    collections: 'Collections',
    custom: 'Personnalisé',
    description: 'Description',
    descriptionDescription: 'Décrivez l’objectif de la clé API.',
    dismiss: 'Fermer',
    generateAPIKey: 'Générer une clé API',
    generateNewKey: 'Générer une nouvelle clé',
    globals: 'Globals',
    keepKeyPrivate: 'Gardez votre clé privée.',
    keyPrivateDescription: 'Cette clé donne à MCP accès à votre contenu. Ne la partagez pas avec d’autres personnes !',
    lastUsed: 'Dernière utilisation',
    manageAPIKeys: 'Gérer les clés API',
    mcp: 'MCP',
    noAPIKeys: 'Aucune clé API',
    operations: 'Opérations',
    owner: 'Propriétaire',
    overrideAccess: 'Ignorer le contrôle d’accès',
    overrideAccessDescription: 'Lorsque cette option est activée, cette clé ignore le contrôle d’accès de Payload pour chaque opération. Laissez-la désactivée sauf raison précise.',
    permissions: 'Autorisations',
    permissionsDescription: 'Autorisez les clients MCP à accéder aux collections, outils, ressources et prompts suivants.',
    prompts: 'Prompts',
    resources: 'Ressources',
    server: 'Serveur',
    title: 'Titre',
    titleDescription: 'Un surnom utile pour la clé API.',
    tools: 'Outils',
    userDescription: 'L’utilisateur au nom duquel MCP agira.',
  },
}

export const fr: PluginLanguage = {
  dateFNSKey: 'fr',
  translations: frTranslations,
}
