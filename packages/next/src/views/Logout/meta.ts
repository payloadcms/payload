import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateLogoutMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    config,
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    title: t('authentication:logout'),
  })
