"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedMonacoLocale = void 0;
const getSupportedMonacoLocale = (locale) => {
    const supportedLocales = {
        de: 'de',
        es: 'es',
        fr: 'fr',
        it: 'it',
        ja: 'ja',
        ko: 'ko',
        ru: 'ru',
        zh: 'zh-cn',
        'zh-tw': 'zh-tw',
    };
    return supportedLocales[locale];
};
exports.getSupportedMonacoLocale = getSupportedMonacoLocale;
//# sourceMappingURL=getSupportedMonacoLocale.js.map