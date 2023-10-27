import type { Config } from 'payload/config'

import type { PluginConfig } from './types'

import { generateSubmissionCollection } from './collections/FormSubmissions'
import { generateFormCollection } from './collections/Forms'

export { fields } from './collections/Forms/fields'
export { getPaymentTotal } from './utilities/getPaymentTotal'

const FormBuilder =
  (incomingFormConfig: PluginConfig) =>
  (config: Config): Config => {
    const formConfig: PluginConfig = {
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
      // admin: {
      //   ...config.admin,
      //   webpack: (webpackConfig) => ({
      //     ...webpackConfig,
      //     resolve: {
      //       ...webpackConfig.resolve,
      //       alias: {
      //         ...webpackConfig.resolve.alias,
      //         [path.resolve(__dirname, 'collections/FormSubmissions/hooks/sendEmail.ts')]: path.resolve(__dirname, 'mocks/serverModule.js'),
      //         [path.resolve(__dirname, 'collections/FormSubmissions/hooks/createCharge.ts')]: path.resolve(__dirname, 'mocks/serverModule.js'),
      //       },
      //     },
      //   })
      // },
      collections: [
        ...(config?.collections || []),
        generateFormCollection(formConfig),
        generateSubmissionCollection(formConfig),
      ],
    }
  }

export default FormBuilder
