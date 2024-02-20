"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initI18n = exports.matchLanguage = exports.t = exports.getTranslationString = void 0;
const deepMerge_1 = require("./deepMerge");
/**
 * @function getTranslationString
 *
 * Gets a translation string from a translations object
 *
 * @returns string
 */
const getTranslationString = ({ count, key, translations, }) => {
    const keys = key.split(':');
    let keySuffix = '';
    const translation = keys.reduce((acc, key, index) => {
        if (typeof acc === 'string')
            return acc;
        if (typeof count === 'number') {
            if (count === 0 && `${key}_zero` in acc) {
                keySuffix = '_zero';
            }
            else if (count === 1 && `${key}_one` in acc) {
                keySuffix = '_one';
            }
            else if (count === 2 && `${key}_two` in acc) {
                keySuffix = '_two';
            }
            else if (count > 5 && `${key}_many` in acc) {
                keySuffix = '_many';
            }
            else if (count > 2 && count <= 5 && `${key}_few` in acc) {
                keySuffix = '_few';
            }
            else if (`${key}_other` in acc) {
                keySuffix = '_other';
            }
        }
        let keyToUse = key;
        if (index === keys.length - 1 && keySuffix) {
            keyToUse = `${key}${keySuffix}`;
        }
        if (acc && keyToUse in acc) {
            return acc[keyToUse];
        }
        return undefined;
    }, translations);
    if (!translation) {
        console.log('key not found: ', key);
    }
    return translation || key;
};
exports.getTranslationString = getTranslationString;
/**
 * @function replaceVars
 *
 * Replaces variables in a translation string with values from an object
 *
 * @returns string
 */
const replaceVars = ({ translationString, vars, }) => {
    const parts = translationString.split(/({{.*?}})/);
    return parts
        .map((part) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
            const placeholder = part.substring(2, part.length - 2).trim();
            return vars[placeholder] || part;
        }
        else {
            return part;
        }
    })
        .join('');
};
const t = ({ key, translations, vars }) => {
    let translationString = (0, exports.getTranslationString)({
        count: typeof vars?.count === 'number' ? vars.count : undefined,
        key,
        translations,
    });
    if (vars) {
        translationString = replaceVars({
            translationString,
            vars,
        });
    }
    if (!translationString) {
        translationString = key;
    }
    return translationString;
};
exports.t = t;
function parseAcceptLanguage(header) {
    return header
        .split(',')
        .map((lang) => {
        const [language, quality] = lang.trim().split(';q=');
        return {
            language,
            quality: quality ? parseFloat(quality) : 1,
        };
    })
        .sort((a, b) => b.quality - a.quality); // Sort by quality, highest to lowest
}
const acceptedLanguages = [
    'ar',
    'az',
    'bg',
    'cs',
    'de',
    'en',
    'es',
    'fa',
    'fr',
    'hr',
    'hu',
    'it',
    'ja',
    'ko',
    'my',
    'nb',
    'nl',
    'pl',
    'pt',
    'ro',
    'rs',
    'rsLatin',
    'ru',
    'sv',
    'th',
    'tr',
    'ua',
    'vi',
    'zh',
    'zhTw',
];
function matchLanguage(header) {
    const parsedHeader = parseAcceptLanguage(header);
    for (const { language } of parsedHeader) {
        for (const acceptedLanguage of acceptedLanguages) {
            if (language.startsWith(acceptedLanguage)) {
                return acceptedLanguage;
            }
        }
    }
    return undefined;
}
exports.matchLanguage = matchLanguage;
const initTFunction = (args) => (key, vars) => {
    const { config, language, translations } = args;
    const mergedLanguages = (0, deepMerge_1.deepMerge)(config?.translations ?? {}, translations);
    const languagePreference = matchLanguage(language);
    return (0, exports.t)({
        key,
        translations: mergedLanguages[languagePreference],
        vars,
    });
};
function memoize(fn, keys) {
    const cacheMap = new Map();
    return async function (args) {
        const cacheKey = keys.reduce((acc, key) => acc + args[key], '');
        if (!cacheMap.has(cacheKey)) {
            const result = await fn(args);
            cacheMap.set(cacheKey, result);
        }
        return cacheMap.get(cacheKey);
    };
}
exports.initI18n = memoize((async ({ config, language = 'en', translations }) => {
    const i18n = {
        fallbackLanguage: config.fallbackLanguage,
        language: language || config.fallbackLanguage,
        t: initTFunction({
            config,
            language: language || config.fallbackLanguage,
            translations,
        }),
    };
    return i18n;
}), ['language']);
