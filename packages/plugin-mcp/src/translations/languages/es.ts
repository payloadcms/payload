import type { PluginLanguage } from '../types.js'

export const esTranslations = {
  'plugin-mcp': {
    apiKey: 'Clave API',
    apiKeyDescription: 'Las claves API controlan a qué colecciones, recursos, herramientas y prompts pueden acceder los clientes MCP.',
    apiKeys: 'Claves API',
    authentication: 'Autenticación',
    collections: 'Colecciones',
    custom: 'Personalizado',
    description: 'Descripción',
    descriptionDescription: 'Describe el propósito de la clave API.',
    dismiss: 'Cerrar',
    generateAPIKey: 'Generar clave API',
    generateNewKey: 'Generar nueva clave',
    globals: 'Globales',
    keepKeyPrivate: 'Mantén tu clave privada.',
    keyPrivateDescription: 'Esta clave da a MCP acceso a tu contenido. ¡No la compartas con otras personas!',
    lastUsed: 'Último uso',
    manageAPIKeys: 'Administrar claves API',
    mcp: 'MCP',
    noAPIKeys: 'No hay claves API',
    operations: 'Operaciones',
    owner: 'Propietario',
    overrideAccess: 'Omitir control de acceso',
    overrideAccessDescription: 'Cuando está activado, esta clave omite el control de acceso de Payload en cada operación que realiza. Déjalo desactivado salvo que tengas un motivo específico.',
    permissions: 'Permisos',
    permissionsDescription: 'Permite que los clientes MCP accedan a las siguientes colecciones, herramientas, recursos y prompts.',
    prompts: 'Prompts',
    resources: 'Recursos',
    server: 'Servidor',
    title: 'Título',
    titleDescription: 'Un nombre útil para la clave API.',
    tools: 'Herramientas',
    userDescription: 'El usuario en cuyo nombre actuará MCP.',
  },
}

export const es: PluginLanguage = {
  dateFNSKey: 'es',
  translations: esTranslations,
}
