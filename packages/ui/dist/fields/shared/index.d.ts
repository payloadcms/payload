import type { Locale, SanitizedLocalizationConfig } from 'payload';
export declare const fieldBaseClass = "field-type";
/**
 * Determines whether a field should be displayed as right-to-left (RTL) based on its configuration, payload's localization configuration and the adming user's currently enabled locale.

 * @returns Whether the field should be displayed as RTL.
 */
export declare function isFieldRTL({ fieldLocalized, fieldRTL, locale, localizationConfig, }: {
    fieldLocalized: boolean;
    fieldRTL: boolean;
    locale: Locale;
    localizationConfig?: SanitizedLocalizationConfig;
}): boolean;
//# sourceMappingURL=index.d.ts.map