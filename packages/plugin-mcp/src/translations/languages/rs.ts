import type { PluginLanguage } from '../types.js'

export const rsTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API кључеви контролишу којим колекцијама, ресурсима, алатима и промптовима MCP клијенти могу да приступе.',
    apiKeys: 'API кључеви',
    authentication: 'Аутентификација',
    confirmRotation: 'Confirm rotation',
    description: 'Опис',
    descriptionDescription: 'Опишите сврху API кључа.',
    dismiss: 'Затвори',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Чувајте кључ приватним.',
    keyPrivateDescription: 'Овај кључ даје MCP-у приступ вашем садржају. Не делите га са другима!',
    lastUsed: 'Последњи пут коришћено',
    manageAPIKeys: 'Управљај API кључевима',
    mcp: 'MCP',
    noAPIKeys: 'Нема API кључева',
    operations: 'Операције',
    overrideAccess: 'Заобиђи контролу приступа',
    overrideAccessDescription:
      'Када је означено, овај кључ заобилази Payload контролу приступа при свакој операцији. Оставите неозначено осим ако имате конкретан разлог.',
    permissions: 'Дозволе',
    permissionsDescription:
      'Дозволите MCP клијентима приступ следећим колекцијама, алатима, ресурсима и промптовима.',
    prompts: 'Промптови',
    resources: 'Ресурси',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Сервер',
    title: 'Наслов',
    titleDescription: 'Користан надимак за API кључ.',
    tools: 'Алати',
    userDescription: 'Корисник у чије име ће MCP деловати.',
  },
}

export const rs: PluginLanguage = {
  dateFNSKey: 'rs',
  translations: rsTranslations,
}
