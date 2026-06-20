import type { PluginLanguage } from '../types.js'

export const trTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API anahtarları, MCP istemcilerinin hangi koleksiyonlara, kaynaklara, araçlara ve promptlara erişebileceğini kontrol eder.',
    apiKeys: 'API anahtarları',
    authentication: 'Kimlik doğrulama',
    confirmRotation: 'Confirm rotation',
    description: 'Açıklama',
    descriptionDescription: 'API anahtarının amacını açıklayın.',
    dismiss: 'Kapat',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Anahtarınızı gizli tutun.',
    keyPrivateDescription: 'Bu anahtar MCP’ye içeriğinize erişim verir. Başkalarıyla paylaşmayın!',
    lastUsed: 'Son kullanım',
    manageAPIKeys: 'API anahtarlarını yönet',
    mcp: 'MCP',
    noAPIKeys: 'API anahtarı yok',
    operations: 'İşlemler',
    overrideAccess: 'Erişim kontrolünü geçersiz kıl',
    overrideAccessDescription:
      'İşaretlendiğinde bu anahtar, gerçekleştirdiği her işlemde Payload erişim kontrolünü atlar. Belirli bir nedeniniz yoksa işaretlemeyin.',
    permissions: 'İzinler',
    permissionsDescription:
      'MCP istemcilerinin aşağıdaki koleksiyonlara, araçlara, kaynaklara ve promptlara erişmesine izin verin.',
    prompts: 'Promptlar',
    resources: 'Kaynaklar',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Sunucu',
    title: 'Başlık',
    titleDescription: 'API anahtarı için kullanışlı bir takma ad.',
    tools: 'Araçlar',
    userDescription: 'MCP’nin adına işlem yapacağı kullanıcı.',
  },
}

export const tr: PluginLanguage = {
  dateFNSKey: 'tr',
  translations: trTranslations,
}
