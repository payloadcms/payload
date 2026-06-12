import type { PluginLanguage } from '../types.js'

export const heTranslations = {
  'plugin-mcp': {
    apiKey: 'מפתח API',
    apiKeyDescription: 'מפתחות API קובעים לאילו אוספים, משאבים, כלים והנחיות לקוחות MCP יכולים לגשת.',
    apiKeys: 'מפתחות API',
    authentication: 'אימות',
    collections: 'אוספים',
    custom: 'מותאם אישית',
    description: 'תיאור',
    descriptionDescription: 'תאר את מטרת מפתח ה-API.',
    dismiss: 'סגור',
    generateAPIKey: 'צור מפתח API',
    generateNewKey: 'צור מפתח חדש',
    globals: 'גלובליים',
    keepKeyPrivate: 'שמור את המפתח שלך פרטי.',
    keyPrivateDescription: 'מפתח זה נותן ל-MCP גישה לתוכן שלך. אל תשתף אותו עם אחרים!',
    lastUsed: 'שימוש אחרון',
    manageAPIKeys: 'נהל מפתחות API',
    mcp: 'MCP',
    noAPIKeys: 'אין מפתחות API',
    operations: 'פעולות',
    overrideAccess: 'עקוף בקרת גישה',
    overrideAccessDescription: 'כאשר מסומן, מפתח זה עוקף את בקרת הגישה של Payload בכל פעולה שהוא מבצע. השאר לא מסומן אלא אם יש סיבה ספציפית.',
    owner: 'בעלים',
    permissions: 'הרשאות',
    permissionsDescription: 'אפשר ללקוחות MCP לגשת לאוספים, לכלים, למשאבים ולהנחיות הבאים.',
    prompts: 'הנחיות',
    resources: 'משאבים',
    server: 'שרת',
    title: 'כותרת',
    titleDescription: 'כינוי שימושי למפתח ה-API.',
    tools: 'כלים',
    userDescription: 'המשתמש ש-MCP יפעל בשמו.',
  },
}

export const he: PluginLanguage = {
  dateFNSKey: 'he',
  translations: heTranslations,
}
