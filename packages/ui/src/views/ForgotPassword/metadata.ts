import type { GenerateViewMetadata } from '../types.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateForgotPasswordViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  generateMetadata({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    title: t('authentication:forgotPassword'),
    ...(config.admin.meta || {}),
    serverURL: config.serverURL,
  })
