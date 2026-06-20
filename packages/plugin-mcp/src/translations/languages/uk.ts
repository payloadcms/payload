import type { PluginLanguage } from '../types.js'

export const ukTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API-ключі керують тим, до яких колекцій, ресурсів, інструментів і промптів можуть мати доступ MCP-клієнти.',
    apiKeys: 'API-ключі',
    authentication: 'Автентифікація',
    description: 'Опис',
    descriptionDescription: 'Опишіть призначення API-ключа.',
    dismiss: 'Закрити',
    keepKeyPrivate: 'Зберігайте ключ приватним.',
    keyPrivateDescription:
      'Цей ключ надає MCP доступ до вашого контенту. Не діліться ним з іншими!',
    lastUsed: 'Останнє використання',
    manageAPIKeys: 'Керувати API-ключами',
    mcp: 'MCP',
    noAPIKeys: 'Немає API-ключів',
    operations: 'Операції',
    overrideAccess: 'Перевизначити контроль доступу',
    overrideAccessDescription:
      'Якщо увімкнено, цей ключ обходить контроль доступу Payload під час кожної операції. Залиште вимкненим, якщо немає конкретної причини.',
    permissions: 'Дозволи',
    permissionsDescription:
      'Дозвольте MCP-клієнтам доступ до таких колекцій, інструментів, ресурсів і промптів.',
    prompts: 'Промпти',
    resources: 'Ресурси',
    server: 'Сервер',
    title: 'Назва',
    titleDescription: 'Зручна назва для API-ключа.',
    tools: 'Інструменти',
    userDescription: 'Користувач, від імені якого діятиме MCP.',
  },
}

export const uk: PluginLanguage = {
  dateFNSKey: 'uk',
  translations: ukTranslations,
}
