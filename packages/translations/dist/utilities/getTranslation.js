"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslation = void 0;
const getTranslation = (label, i18n) => {
    if (typeof label === 'object') {
        if (label[i18n.language]) {
            return label[i18n.language];
        }
        let fallbacks = [];
        if (typeof i18n.fallbackLanguage === 'string') {
            fallbacks = [i18n.fallbackLanguage];
        }
        else if (Array.isArray(i18n.fallbackLanguage)) {
            fallbacks = i18n.fallbackLanguage;
        }
        const fallbackLang = fallbacks.find((language) => label[language]);
        return fallbackLang && label[fallbackLang] ? fallbackLang : label[Object.keys(label)[0]];
    }
    return label;
};
exports.getTranslation = getTranslation;
