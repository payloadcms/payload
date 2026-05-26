import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateAccountViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: `${t('authentication:accountOfCurrentUser')}`,
    keywords: `${t('authentication:account')}`,
    serverURL: config.serverURL,
    title: t('authentication:account'),
    ...(config.admin.meta || {}),
  })
