import { Translations, InitI18n } from '../types';
/**
 * @function getTranslationString
 *
 * Gets a translation string from a translations object
 *
 * @returns string
 */
export declare const getTranslationString: ({ count, key, translations, }: {
    count?: number;
    key: string;
    translations: Translations[0];
}) => string;
/**
 * @function t
 *
 * Merges config defined translations with translations passed in as an argument
 * returns a function that can be used to translate a string
 *
 * @returns string
 */
type TFunctionConstructor = ({ key, translations, vars, }: {
    key: string;
    translations?: Translations[0];
    vars?: Record<string, any>;
}) => string;
export declare const t: TFunctionConstructor;
export declare function matchLanguage(header: string): string | undefined;
export declare const initI18n: InitI18n;
export {};
