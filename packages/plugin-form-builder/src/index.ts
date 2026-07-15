import { definePlugin } from 'payload'
import { deepMergeSimple } from 'payload/shared'

import type { PluginDefaultTranslationsObject } from './translations/types.js'
import type { FormBuilderPluginConfig } from './types.js'

import { generateFormCollection } from './collections/Forms/index.js'
import { generateSubmissionCollection } from './collections/FormSubmissions/index.js'
import { translations } from './translations/index.js'

export { fields } from './collections/Forms/fields.js'
export { translations as formBuilderTranslations } from './translations/index.js'
export { getPaymentTotal } from './utilities/getPaymentTotal.js'

export const formBuilderPlugin = definePlugin<FormBuilderPluginConfig>({
  slug: '@payloadcms/plugin-form-builder',
  plugin: ({ config, options: incomingFormConfig }) => {
    if (!config.i18n) {
      config.i18n = {}
    }

    const formConfig: FormBuilderPluginConfig = {
      ...incomingFormConfig,
      fields: {
        checkbox: true,
        country: true,
        email: true,
        message: true,
        number: true,
        payment: false,
        select: true,
        state: true,
        text: true,
        textarea: true,
        upload: false,
        ...incomingFormConfig.fields,
      },
    }

    const isUploadFieldEnabled = formConfig.fields?.upload !== false
    const hasUploadCollections =
      Array.isArray(formConfig.uploadCollections) && formConfig.uploadCollections.length > 0

    if (isUploadFieldEnabled && !hasUploadCollections) {
      // eslint-disable-next-line no-console
      console.warn(
        '[plugin-form-builder] fields.upload is enabled but uploadCollections is empty or missing. Upload fields will not be registered. Set uploadCollections to an array of upload-enabled collection slugs.',
      )
    }

    /**
     * Merge plugin translations — only for languages the user has enabled.
     * Plugins run before sanitize, so `supportedLanguages` may be undefined; sanitize will
     * default it to `{ en }`, so we mirror that here to avoid merging 40+ unused tables.
     */
    const supportedLanguageKeys = config.i18n?.supportedLanguages
      ? Object.keys(config.i18n.supportedLanguages)
      : ['en']

    const flattenedTranslations: Record<string, PluginDefaultTranslationsObject> = {}
    for (const lang of supportedLanguageKeys) {
      const entry = translations[lang as keyof typeof translations] ?? translations.en!
      flattenedTranslations[lang] = entry.translations
    }

    return {
      ...config,
      collections: [
        ...(config?.collections || []),
        generateFormCollection(formConfig, config?.collections),
        generateSubmissionCollection(formConfig),
      ],
      i18n: {
        ...config.i18n,
        translations: deepMergeSimple(flattenedTranslations, config.i18n?.translations ?? {}),
      },
    }
  },
})
