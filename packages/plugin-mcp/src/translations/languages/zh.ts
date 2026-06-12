import type { PluginLanguage } from '../types.js'

export const zhTranslations = {
  'plugin-mcp': {
    apiKey: 'API 密钥',
    apiKeyDescription: 'API 密钥控制 MCP 客户端可以访问哪些集合、资源、工具和提示词。',
    apiKeys: 'API 密钥',
    authentication: '身份验证',
    collections: '集合',
    custom: '自定义',
    description: '描述',
    descriptionDescription: '描述 API 密钥的用途。',
    dismiss: '关闭',
    generateAPIKey: '生成 API 密钥',
    generateNewKey: '生成新密钥',
    globals: '全局',
    keepKeyPrivate: '请妥善保管你的密钥。',
    keyPrivateDescription: '此密钥会让 MCP 访问你的内容。不要与他人共享！',
    lastUsed: '上次使用',
    manageAPIKeys: '管理 API 密钥',
    mcp: 'MCP',
    noAPIKeys: '没有 API 密钥',
    operations: '操作',
    overrideAccess: '覆盖访问控制',
    overrideAccessDescription: '启用后，此密钥执行的每个操作都会绕过 Payload 访问控制。除非有明确原因，否则请保持关闭。',
    owner: '所有者',
    permissions: '权限',
    permissionsDescription: '允许 MCP 客户端访问以下集合、工具、资源和提示词。',
    prompts: '提示词',
    resources: '资源',
    server: '服务器',
    title: '标题',
    titleDescription: 'API 密钥的易识别名称。',
    tools: '工具',
    userDescription: 'MCP 将代表其操作的用户。',
  },
}

export const zh: PluginLanguage = {
  dateFNSKey: 'zh-CN',
  translations: zhTranslations,
}
