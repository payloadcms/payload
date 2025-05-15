import type { GenericTranslationsObject } from '@payloadcms/translations'

export const en: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  ecommerce: {
    productRequired: 'A product is required.',
    variantOptionsAlreadyExists:
      'This variant combo is already in use by another variant. Please select different options.',
    variantOptionsRequired: 'Variant options are required.',
    variantOptionsRequiredAll: 'All variant options are required.',
  },
}
