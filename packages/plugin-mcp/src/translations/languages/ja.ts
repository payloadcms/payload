import type { PluginLanguage } from '../types.js'

export const jaTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'APIキーは、MCPクライアントがアクセスできるコレクション、リソース、ツール、プロンプトを制御します。',
    apiKeys: 'APIキー',
    authentication: '認証',
    confirmRotation: 'Confirm rotation',
    description: '説明',
    descriptionDescription: 'APIキーの目的を説明してください。',
    dismiss: '閉じる',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'キーは非公開にしてください。',
    keyPrivateDescription:
      'このキーにより、MCPはあなたのコンテンツへアクセスできます。他の人と共有しないでください。',
    lastUsed: '最終使用',
    manageAPIKeys: 'APIキーを管理',
    mcp: 'MCP',
    noAPIKeys: 'APIキーがありません',
    operations: '操作',
    overrideAccess: 'アクセス制御を上書き',
    overrideAccessDescription:
      '有効にすると、このキーが実行するすべての操作でPayloadのアクセス制御をバイパスします。明確な理由がない限り無効のままにしてください。',
    permissions: '権限',
    permissionsDescription:
      'MCPクライアントに次のコレクション、ツール、リソース、プロンプトへのアクセスを許可します。',
    prompts: 'プロンプト',
    resources: 'リソース',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
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
