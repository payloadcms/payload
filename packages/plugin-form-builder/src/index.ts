import type { Config } from 'payload'

import type { FormBuilderPluginConfig } from './types.js'

import { generateFormCollection } from './collections/Forms/index.js'
import { generateSubmissionCollection } from './collections/FormSubmissions/index.js'

export { fields } from './collections/Forms/fields.js'
export { getPaymentTotal } from './utilities/getPaymentTotal.js'

export const formBuilderPlugin =
  (incomingFormConfig: FormBuilderPluginConfig) =>
  (config: Config): Config => {
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

    return {
      ...config,
      collections: [
        ...(config?.collections || []),
        generateFormCollection(formConfig, config?.collections),
        generateSubmissionCollection(formConfig),
      ],
    }
  }
