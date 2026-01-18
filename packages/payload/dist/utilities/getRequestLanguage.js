import { extractHeaderLanguage } from '@payloadcms/translations';
export const getRequestLanguage = ({ config, cookies, headers })=>{
    const supportedLanguageKeys = Object.keys(config.i18n.supportedLanguages);
    const langCookie = cookies.get(`${config.cookiePrefix || 'payload'}-lng`);
    const languageFromCookie = typeof langCookie === 'string' ? langCookie : langCookie?.value;
    if (languageFromCookie && supportedLanguageKeys.includes(languageFromCookie)) {
        return languageFromCookie;
    }
    const languageFromHeader = headers.get('Accept-Language') ? extractHeaderLanguage(headers.get('Accept-Language')) : undefined;
    if (languageFromHeader && supportedLanguageKeys.includes(languageFromHeader)) {
        return languageFromHeader;
    }
    return config.i18n.fallbackLanguage;
};

//# sourceMappingURL=getRequestLanguage.js.map