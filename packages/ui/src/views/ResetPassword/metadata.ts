import type { ViewMetadata } from '../../utilities/meta.js'
import type { GenerateViewMetadata } from '../types.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateResetPasswordViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}): Promise<ViewMetadata> =>
  generateMetadata({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
    ...(config.admin.meta || {}),
  })
