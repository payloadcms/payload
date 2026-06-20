import type { PluginLanguage } from '../types.js'

export const azTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API açarları MCP müştərilərinin hansı kolleksiyalara, resurslara, alətlərə və promptlara daxil ola biləcəyini idarə edir.',
    apiKeys: 'API açarları',
    authentication: 'Autentifikasiya',
    confirmRotation: 'Confirm rotation',
    description: 'Təsvir',
    descriptionDescription: 'API açarının məqsədini təsvir edin.',
    dismiss: 'Bağla',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: 'Açarınızı məxfi saxlayın.',
    keyPrivateDescription: 'Bu açar MCP-yə məzmununuza giriş verir. Onu başqaları ilə paylaşmayın!',
    lastUsed: 'Son istifadə',
    manageAPIKeys: 'API açarlarını idarə et',
    mcp: 'MCP',
    noAPIKeys: 'API açarı yoxdur',
    operations: 'Əməliyyatlar',
    overrideAccess: 'Giriş nəzarətini keç',
    overrideAccessDescription:
      'İşarələndikdə bu açar icra etdiyi hər əməliyyatda Payload giriş qaydalarını keçir. Xüsusi səbəbiniz yoxdursa işarələməyin.',
    permissions: 'İcazələr',
    permissionsDescription:
      'MCP müştərilərinə aşağıdakı kolleksiyalara, alətlərə, resurslara və promptlara giriş icazəsi verin.',
    prompts: 'Promptlar',
    resources: 'Resurslar',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: 'Server',
    title: 'Başlıq',
    titleDescription: 'API açarı üçün faydalı qısa ad.',
    tools: 'Alətlər',
    userDescription: 'MCP-nin adından işləyəcəyi istifadəçi.',
  },
}

export const az: PluginLanguage = {
  dateFNSKey: 'az',
  translations: azTranslations,
}
