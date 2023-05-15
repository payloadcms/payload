import type { Config } from 'payload/config'

import { generateFormCollection } from './collections/Forms'
import { generateSubmissionCollection } from './collections/FormSubmissions'
import type { PluginConfig } from './types'
// import path from 'path';

export { getPaymentTotal } from './utilities/getPaymentTotal'

const FormBuilder =
  (incomingFormConfig: PluginConfig) =>
  (config: Config): Config => {
    const formConfig: PluginConfig = {
      ...incomingFormConfig,
      fields: {
        text: true,
        textarea: true,
        select: true,
        email: true,
        state: true,
        country: true,
        number: true,
        checkbox: true,
        message: true,
        payment: false,
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
