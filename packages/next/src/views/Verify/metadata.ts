import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateVerifyViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    serverURL: config.serverURL,
    title: t('authentication:verify'),
    ...(config.admin.meta || {}),
  })
