import type { PluginLanguage } from '../types.js'

export const faTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'کلیدهای API کنترل می‌کنند کلاینت‌های MCP به کدام مجموعه‌ها، منابع، ابزارها و پرامپت‌ها دسترسی داشته باشند.',
    apiKeys: 'کلیدهای API',
    authentication: 'احراز هویت',
    description: 'توضیح',
    descriptionDescription: 'هدف کلید API را توضیح دهید.',
    dismiss: 'بستن',
    keepKeyPrivate: 'کلید خود را محرمانه نگه دارید.',
    keyPrivateDescription: 'این کلید به MCP دسترسی به محتوای شما می‌دهد. آن را با دیگران به اشتراک نگذارید!',
    lastUsed: 'آخرین استفاده',
    manageAPIKeys: 'مدیریت کلیدهای API',
    mcp: 'MCP',
    noAPIKeys: 'هیچ کلید API وجود ندارد',
    operations: 'عملیات',
    overrideAccess: 'نادیده گرفتن کنترل دسترسی',
    overrideAccessDescription: 'در صورت فعال بودن، این کلید در هر عملیاتی کنترل دسترسی Payload را دور می‌زند. مگر با دلیل مشخص، آن را غیرفعال نگه دارید.',
    permissions: 'مجوزها',
    permissionsDescription: 'به کلاینت‌های MCP اجازه دهید به مجموعه‌ها، ابزارها، منابع و پرامپت‌های زیر دسترسی داشته باشند.',
    prompts: 'پرامپت‌ها',
    resources: 'منابع',
    server: 'سرور',
    title: 'عنوان',
    titleDescription: 'یک نام مستعار مفید برای کلید API.',
    tools: 'ابزارها',
    userDescription: 'کاربری که MCP به نمایندگی از او عمل می‌کند.',
  },
}

export const fa: PluginLanguage = {
  dateFNSKey: 'fa-IR',
  translations: faTranslations,
}
