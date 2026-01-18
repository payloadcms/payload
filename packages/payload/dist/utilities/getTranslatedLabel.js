import { getTranslation } from '@payloadcms/translations';
export const getTranslatedLabel = (label, i18n)=>{
    if (typeof label === 'function') {
        return label({
            i18n: i18n,
            t: i18n.t
        });
    }
    if (typeof label === 'object') {
        return getTranslation(label, i18n);
    }
    return label;
};

//# sourceMappingURL=getTranslatedLabel.js.map