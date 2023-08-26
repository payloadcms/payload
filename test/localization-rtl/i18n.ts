import en from '../../src/translations/en.json';
import { ar } from './ar';
import deepMerge from './deepMerge';

export const i18n = {
    fallbackLng: 'en', // default
    debug: false, // default
    resources: {
        ar: deepMerge(en, ar),
    },
}