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
        ...incomingFormConfig.fields,
      },
    }

    return {
      ...config,
      collections: [
        ...(config?.collections || []),
        generateFormCollection(formConfig),
        generateSubmissionCollection(formConfig),
      ],
    }
  }
