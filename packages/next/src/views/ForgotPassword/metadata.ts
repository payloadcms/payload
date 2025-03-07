import type { MetaConfig } from 'payload'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateForgotPasswordViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  generateMetadata({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    title: t('authentication:forgotPassword'),
    ...((config.admin.meta || {}) as MetaConfig),
    serverURL: config.serverURL,
  })
