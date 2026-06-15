import type { PluginLanguage } from '../types.js'

export const bgTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'API ключовете контролират до кои колекции, ресурси, инструменти и подкани имат достъп MCP клиентите.',
    apiKeys: 'API ключове',
    authentication: 'Удостоверяване',
    description: 'Описание',
    descriptionDescription: 'Опишете предназначението на API ключа.',
    dismiss: 'Затвори',
    keepKeyPrivate: 'Пазете ключа си поверителен.',
    keyPrivateDescription: 'Този ключ дава на MCP достъп до съдържанието ви. Не го споделяйте с други!',
    lastUsed: 'Последно използван',
    manageAPIKeys: 'Управление на API ключове',
    mcp: 'MCP',
    noAPIKeys: 'Няма API ключове',
    operations: 'Операции',
    overrideAccess: 'Заобикаляне на контрола за достъп',
    overrideAccessDescription: 'Когато е отметнато, този ключ заобикаля контрола за достъп на Payload при всяка операция. Оставете изключено, освен ако нямате конкретна причина.',
    permissions: 'Разрешения',
    permissionsDescription: 'Разрешете на MCP клиентите достъп до следните колекции, инструменти, ресурси и подкани.',
    prompts: 'Подкани',
    resources: 'Ресурси',
    server: 'Сървър',
    title: 'Заглавие',
    titleDescription: 'Полезно име за API ключа.',
    tools: 'Инструменти',
    userDescription: 'Потребителят, от чието име ще действа MCP.',
  },
}

export const bg: PluginLanguage = {
  dateFNSKey: 'bg',
  translations: bgTranslations,
}
