"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslation = void 0;
const getTranslation = (label, i18n) => {
    var _a;
    if (typeof label === 'object') {
        if (label[i18n.language]) {
            return label[i18n.language];
        }
        let fallbacks = [];
        if (typeof i18n.options.fallbackLng === 'string') {
            fallbacks = [i18n.options.fallbackLng];
        }
        else if (Array.isArray(i18n.options.fallbackLng)) {
            fallbacks = i18n.options.fallbackLng;
        }
        else if (typeof i18n.options.fallbackLng === 'object') {
            fallbacks = Object.keys(i18n.options.fallbackLng);
        }
        else if (typeof i18n.options.fallbackLng === 'function') {
            console.warn('Use of i18next fallbackLng functions are not supported.');
        }
        return (_a = label[fallbacks.find((language) => (label[language]))]) !== null && _a !== void 0 ? _a : label[Object.keys(label)[0]];
    }
    return label;
};
exports.getTranslation = getTranslation;
//# sourceMappingURL=getTranslation.js.map