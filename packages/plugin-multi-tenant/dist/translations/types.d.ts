import type { Language } from '@payloadcms/translations';
import type { enTranslations } from './languages/en.js';
export type PluginLanguage = Language<{
    'plugin-multi-tenant': {
        'assign-tenant-button-label': string;
        'assign-tenant-modal-title': string;
        'field-assignedTenant-label': string;
        'nav-tenantSelector-label': string;
    };
}>;
export type PluginDefaultTranslationsObject = typeof enTranslations;
//# sourceMappingURL=types.d.ts.map