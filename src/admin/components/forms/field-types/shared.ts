import type { LabeledLocale, LocalizationConfig } from 'payload/config';

/**
 * Determines whether a field should be displayed as right-to-left (RTL) based on its configuration, payload's localization configuration and the adming user's currently enabled locale.

 * @returns Whether the field should be displayed as RTL.
 */
export function isFieldRTL({
  fieldRTL,
  fieldLocalized,
  labeledLocale,
  localizationConfig,
}: {
    fieldRTL: boolean;
    fieldLocalized: boolean;
    labeledLocale: LabeledLocale;
    localizationConfig?: LocalizationConfig;
}) {
  const hasMultipleLocales = labeledLocale
      && (localizationConfig)
      && (localizationConfig.locales)
      && (localizationConfig.locales.length > 1);
  const isCurrentLocaleDefaultLocale = labeledLocale?.value === localizationConfig?.defaultLocale;

  return ((fieldRTL !== false && labeledLocale?.rtl === true)
      && (
        fieldLocalized
        || (!fieldLocalized && !hasMultipleLocales) // If there is only one locale which is also rtl, that field is rtl too
        || (!fieldLocalized && isCurrentLocaleDefaultLocale) // If the current locale is the default locale, but the field is not localized, that field is rtl too
      ))
      || (fieldRTL === true); // If fieldRTL is true. This should be useful for when no localization is set at all in the payload config, but you still want fields to be rtl.
}
