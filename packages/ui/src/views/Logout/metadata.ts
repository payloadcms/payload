import type { GenerateViewMetadata } from '../types.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateLogoutViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    serverURL: config.serverURL,
    title: t('authentication:logout'),
  })
