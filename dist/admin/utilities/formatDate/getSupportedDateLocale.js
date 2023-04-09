"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedDateLocale = void 0;
const getSupportedDateLocale = (locale = 'enUS') => {
    const formattedLocales = {
        en: 'enUS',
        my: 'enUS',
        ua: 'uk',
        zh: 'zhCN',
    };
    return formattedLocales[locale] || locale;
};
exports.getSupportedDateLocale = getSupportedDateLocale;
//# sourceMappingURL=getSupportedDateLocale.js.map