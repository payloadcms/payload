import type { Metadata } from 'next'

import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateResetPasswordMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}): Promise<Metadata> =>
  meta({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
    ...(config.admin.meta || {}),
  })
