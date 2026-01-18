import { initI18n } from '@payloadcms/translations';
export const getLocalI18n = async ({ config, language })=>initI18n({
        config: config.i18n,
        context: 'api',
        language
    });

//# sourceMappingURL=getLocalI18n.js.map