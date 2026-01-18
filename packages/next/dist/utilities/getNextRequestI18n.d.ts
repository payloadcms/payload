import type { ClientTranslationsObject, I18nClient } from '@payloadcms/translations';
import { type SanitizedConfig } from 'payload';
/**
 * In the context of Next.js, this function initializes the i18n object for the current request.
 *
 * It must be called on the server side, and within the lifecycle of a request since it relies on the request headers and cookies.
 */
export declare const getNextRequestI18n: <TAdditionalTranslations = {}, TAdditionalClientTranslationKeys extends string = never>({ config, }: {
    config: SanitizedConfig;
}) => Promise<[TAdditionalClientTranslationKeys] extends [never] ? I18nClient : TAdditionalTranslations extends object ? I18nClient<TAdditionalTranslations, TAdditionalClientTranslationKeys> : I18nClient<ClientTranslationsObject, TAdditionalClientTranslationKeys>>;
//# sourceMappingURL=getNextRequestI18n.d.ts.map