import type { PluginLanguage } from '../types.js'

export const trTranslations = {
  'plugin-mcp': {
    apiKey: 'API anahtarı',
    apiKeyDescription: 'API anahtarları, MCP istemcilerinin hangi koleksiyonlara, kaynaklara, araçlara ve promptlara erişebileceğini kontrol eder.',
    apiKeys: 'API anahtarları',
    authentication: 'Kimlik doğrulama',
    collections: 'Koleksiyonlar',
    custom: 'Özel',
    description: 'Açıklama',
    descriptionDescription: 'API anahtarının amacını açıklayın.',
    dismiss: 'Kapat',
    generateAPIKey: 'API anahtarı oluştur',
    generateNewKey: 'Yeni anahtar oluştur',
    globals: 'Globaller',
    keepKeyPrivate: 'Anahtarınızı gizli tutun.',
    keyPrivateDescription: 'Bu anahtar MCP’ye içeriğinize erişim verir. Başkalarıyla paylaşmayın!',
    lastUsed: 'Son kullanım',
    manageAPIKeys: 'API anahtarlarını yönet',
    mcp: 'MCP',
    noAPIKeys: 'API anahtarı yok',
    operations: 'İşlemler',
    overrideAccess: 'Erişim kontrolünü geçersiz kıl',
    overrideAccessDescription: 'İşaretlendiğinde bu anahtar, gerçekleştirdiği her işlemde Payload erişim kontrolünü atlar. Belirli bir nedeniniz yoksa işaretlemeyin.',
    owner: 'Sahip',
    permissions: 'İzinler',
    permissionsDescription: 'MCP istemcilerinin aşağıdaki koleksiyonlara, araçlara, kaynaklara ve promptlara erişmesine izin verin.',
    prompts: 'Promptlar',
    resources: 'Kaynaklar',
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
