import type { AcceptedLanguages, ClientTranslationKeys, ClientTranslationsObject, I18nClient, I18nOptions, Language, TFunction } from '@payloadcms/translations';
import type { LanguageOptions } from 'payload';
import React from 'react';
type ContextType<TAdditionalTranslations = {}, TAdditionalClientTranslationKeys extends string = never> = {
    i18n: [TAdditionalClientTranslationKeys] extends [never] ? I18nClient : TAdditionalTranslations extends object ? I18nClient<TAdditionalTranslations, TAdditionalClientTranslationKeys> : I18nClient<ClientTranslationsObject, TAdditionalClientTranslationKeys>;
    languageOptions: LanguageOptions;
    switchLanguage?: (lang: AcceptedLanguages) => Promise<void>;
    t: TFunction<ClientTranslationKeys | Extract<TAdditionalClientTranslationKeys, string>>;
};
type Props = {
    children: React.ReactNode;
    dateFNSKey: Language['dateFNSKey'];
    fallbackLang: I18nOptions['fallbackLanguage'];
    language: string;
    languageOptions: LanguageOptions;
    switchLanguageServerAction: (lang: string) => Promise<void>;
    translations: I18nClient['translations'];
};
export declare const TranslationProvider: React.FC<Props>;
export declare const useTranslation: <TAdditionalTranslations = {}, TAdditionalClientTranslationKeys extends string = never>() => ContextType<TAdditionalTranslations, TAdditionalClientTranslationKeys>;
export {};
//# sourceMappingURL=index.d.ts.map