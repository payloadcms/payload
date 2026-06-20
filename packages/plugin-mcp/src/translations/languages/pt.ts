import type { PluginLanguage } from '../types.js'

export const ptTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'As chaves de API controlam quais coleções, recursos, ferramentas e prompts os clientes MCP podem acessar.',
    apiKeys: 'Chaves de API',
    authentication: 'Autenticação',
    confirmRotation: 'Confirm rotation',
    description: 'Descrição',
    descriptionDescription: 'Descreva o propósito da chave de API.',
    dismiss: 'Fechar',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Mantenha sua chave privada.',
    keyPrivateDescription:
      'Esta chave dá ao MCP acesso ao seu conteúdo. Não a compartilhe com outras pessoas!',
    lastUsed: 'Último uso',
    manageAPIKeys: 'Gerenciar chaves de API',
    mcp: 'MCP',
    noAPIKeys: 'Nenhuma chave de API',
    operations: 'Operações',
    overrideAccess: 'Substituir controle de acesso',
    overrideAccessDescription:
      'Quando marcado, esta chave ignora o controle de acesso do Payload em todas as operações. Deixe desmarcado a menos que você tenha um motivo específico.',
    permissions: 'Permissões',
    permissionsDescription:
      'Permita que clientes MCP acessem as seguintes coleções, ferramentas, recursos e prompts.',
    prompts: 'Prompts',
    resources: 'Recursos',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Servidor',
    title: 'Título',
    titleDescription: 'Um apelido útil para a chave de API.',
    tools: 'Ferramentas',
    userDescription: 'O usuário como quem o MCP atuará.',
  },
}

export const pt: PluginLanguage = {
  dateFNSKey: 'pt',
  translations: ptTranslations,
}
