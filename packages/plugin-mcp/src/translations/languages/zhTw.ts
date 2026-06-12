import type { PluginLanguage } from '../types.js'

export const zhTwTranslations = {
  'plugin-mcp': {
    apiKey: 'API 金鑰',
    apiKeyDescription: 'API 金鑰控制 MCP 用戶端可以存取哪些集合、資源、工具和提示詞。',
    apiKeys: 'API 金鑰',
    authentication: '驗證',
    collections: '集合',
    custom: '自訂',
    description: '描述',
    descriptionDescription: '描述 API 金鑰的用途。',
    dismiss: '關閉',
    generateAPIKey: '產生 API 金鑰',
    generateNewKey: '產生新金鑰',
    globals: '全域',
    keepKeyPrivate: '請妥善保管你的金鑰。',
    keyPrivateDescription: '此金鑰會讓 MCP 存取你的內容。不要與他人分享！',
    lastUsed: '上次使用',
    manageAPIKeys: '管理 API 金鑰',
    mcp: 'MCP',
    noAPIKeys: '沒有 API 金鑰',
    operations: '操作',
    owner: '擁有者',
    overrideAccess: '覆寫存取控制',
    overrideAccessDescription: '啟用後，此金鑰執行的每個操作都會略過 Payload 存取控制。除非有明確原因，否則請保持關閉。',
    permissions: '權限',
    permissionsDescription: '允許 MCP 用戶端存取以下集合、工具、資源和提示詞。',
    prompts: '提示詞',
    resources: '資源',
    server: '伺服器',
    title: '標題',
    titleDescription: 'API 金鑰的易識別名稱。',
    tools: '工具',
    userDescription: 'MCP 將代表其操作的使用者。',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
