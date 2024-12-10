import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateAccountMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    description: `${t('authentication:accountOfCurrentUser')}`,
    keywords: `${t('authentication:account')}`,
    serverURL: config.serverURL,
    title: t('authentication:account'),
    ...(config.admin.meta || {}),
  })
