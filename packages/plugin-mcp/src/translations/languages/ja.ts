import type { PluginLanguage } from '../types.js'

export const jaTranslations = {
  'plugin-mcp': {
    apiKey: 'APIキー',
    apiKeyDescription: 'APIキーは、MCPクライアントがアクセスできるコレクション、リソース、ツール、プロンプトを制御します。',
    apiKeys: 'APIキー',
    authentication: '認証',
    collections: 'コレクション',
    custom: 'カスタム',
    description: '説明',
    descriptionDescription: 'APIキーの目的を説明してください。',
    dismiss: '閉じる',
    generateAPIKey: 'APIキーを生成',
    generateNewKey: '新しいキーを生成',
    globals: 'グローバル',
    keepKeyPrivate: 'キーは非公開にしてください。',
    keyPrivateDescription: 'このキーにより、MCPはあなたのコンテンツへアクセスできます。他の人と共有しないでください。',
    lastUsed: '最終使用',
    manageAPIKeys: 'APIキーを管理',
    mcp: 'MCP',
    noAPIKeys: 'APIキーがありません',
    operations: '操作',
    owner: '所有者',
    overrideAccess: 'アクセス制御を上書き',
    overrideAccessDescription: '有効にすると、このキーが実行するすべての操作でPayloadのアクセス制御をバイパスします。明確な理由がない限り無効のままにしてください。',
    permissions: '権限',
    permissionsDescription: 'MCPクライアントに次のコレクション、ツール、リソース、プロンプトへのアクセスを許可します。',
    prompts: 'プロンプト',
    resources: 'リソース',
    server: 'サーバー',
    title: 'タイトル',
    titleDescription: 'APIキーのわかりやすい名前。',
    tools: 'ツール',
    userDescription: 'MCPが代理で操作するユーザー。',
  },
}

export const ja: PluginLanguage = {
  dateFNSKey: 'ja',
  translations: jaTranslations,
}
