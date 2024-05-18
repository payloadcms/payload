import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateLogoutMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    serverURL: config.serverURL,
    title: t('authentication:logout'),
  })
