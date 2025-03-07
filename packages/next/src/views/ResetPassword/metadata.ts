import type { Metadata } from 'next'
import type { MetaConfig } from 'payload'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateResetPasswordViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}): Promise<Metadata> =>
  generateMetadata({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
    ...((config.admin.meta || {}) as MetaConfig),
  })
