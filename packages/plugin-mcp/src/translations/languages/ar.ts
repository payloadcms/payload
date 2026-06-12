import type { PluginLanguage } from '../types.js'

export const arTranslations = {
  'plugin-mcp': {
    apiKey: 'مفتاح API',
    apiKeyDescription: 'تتحكم مفاتيح API في المجموعات والموارد والأدوات والمطالبات التي يمكن لعملاء MCP الوصول إليها.',
    apiKeys: 'مفاتيح API',
    authentication: 'المصادقة',
    collections: 'المجموعات',
    custom: 'مخصص',
    description: 'الوصف',
    descriptionDescription: 'صف الغرض من مفتاح API.',
    dismiss: 'إغلاق',
    generateAPIKey: 'إنشاء مفتاح API',
    generateNewKey: 'إنشاء مفتاح جديد',
    globals: 'العناصر العامة',
    keepKeyPrivate: 'حافظ على سرية مفتاحك.',
    keyPrivateDescription: 'هذا المفتاح يمنح MCP إمكانية الوصول إلى محتواك. لا تشاركه مع الآخرين!',
    lastUsed: 'آخر استخدام',
    manageAPIKeys: 'إدارة مفاتيح API',
    mcp: 'MCP',
    noAPIKeys: 'لا توجد مفاتيح API',
    operations: 'العمليات',
    overrideAccess: 'تجاوز التحكم في الوصول',
    overrideAccessDescription: 'عند تفعيله، يتجاوز هذا المفتاح تحكم Payload في الوصول لكل عملية ينفذها. اتركه غير مفعل ما لم يكن لديك سبب محدد.',
    owner: 'المالك',
    permissions: 'الأذونات',
    permissionsDescription: 'اسمح لعملاء MCP بالوصول إلى المجموعات والأدوات والموارد والمطالبات التالية.',
    prompts: 'المطالبات',
    resources: 'الموارد',
    server: 'الخادم',
    title: 'العنوان',
    titleDescription: 'اسم مستعار مفيد لمفتاح API.',
    tools: 'الأدوات',
    userDescription: 'المستخدم الذي سيعمل MCP بصفته.',
  },
}

export const ar: PluginLanguage = {
  dateFNSKey: 'ar',
  translations: arTranslations,
}
