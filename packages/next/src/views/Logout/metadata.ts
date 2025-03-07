import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

export const generateLogoutViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    serverURL: config.serverURL,
    title: t('authentication:logout'),
  })
