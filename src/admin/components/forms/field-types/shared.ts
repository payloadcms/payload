import type { LabeledLocale, LocalizationConfig } from 'payload/config';
import unifiedLocaleConfig from '../../../../utilities/unifiedLocaleConfig';

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
  const isDefaultLocaleRTL = localizationConfig?.locales?.length > 1
    && typeof localizationConfig.locales[0] !== 'string'
    && (localizationConfig.locales as LabeledLocale[]).find((locale) => locale?.value === localizationConfig?.defaultLocale)?.rtl === true;

  return ((fieldRTL !== false)
      && (
        (fieldLocalized && labeledLocale?.rtl === true)
        || (!fieldLocalized && isDefaultLocaleRTL) // If the field is not localized but the default locale is RTL, that field is rtl too
      ))
      || (fieldRTL === true); // If fieldRTL is true. This should be useful for when no localization is set at all in the payload config, but you still want fields to be rtl.
}
