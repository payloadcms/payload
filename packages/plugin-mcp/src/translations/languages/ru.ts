import type { PluginLanguage } from '../types.js'

export const ruTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'API-ключи управляют тем, к каким коллекциям, ресурсам, инструментам и промптам могут получать доступ MCP-клиенты.',
    apiKeys: 'API-ключи',
    authentication: 'Аутентификация',
    description: 'Описание',
    descriptionDescription: 'Опишите назначение API-ключа.',
    dismiss: 'Закрыть',
    keepKeyPrivate: 'Храните ключ в секрете.',
    keyPrivateDescription: 'Этот ключ дает MCP доступ к вашему контенту. Не передавайте его другим!',
    lastUsed: 'Последнее использование',
    manageAPIKeys: 'Управлять API-ключами',
    mcp: 'MCP',
    noAPIKeys: 'Нет API-ключей',
    operations: 'Операции',
    overrideAccess: 'Переопределить контроль доступа',
    overrideAccessDescription: 'Если включено, этот ключ обходит контроль доступа Payload при каждой операции. Оставьте выключенным, если нет конкретной причины.',
    permissions: 'Разрешения',
    permissionsDescription: 'Разрешите MCP-клиентам доступ к следующим коллекциям, инструментам, ресурсам и промптам.',
    prompts: 'Промпты',
    resources: 'Ресурсы',
    server: 'Сервер',
    title: 'Заголовок',
    titleDescription: 'Удобное имя для API-ключа.',
    tools: 'Инструменты',
    userDescription: 'Пользователь, от имени которого будет действовать MCP.',
  },
}

export const ru: PluginLanguage = {
  dateFNSKey: 'ru',
  translations: ruTranslations,
}
