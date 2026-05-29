import type { GenerateViewMetadata } from '../Root/index.js'

import { formatNextMetadata } from '../../utilities/meta.js'

export const generateAccountViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  formatNextMetadata({
    description: `${t('authentication:accountOfCurrentUser')}`,
    keywords: `${t('authentication:account')}`,
    serverURL: config.serverURL,
    title: t('authentication:account'),
    ...(config.admin.meta || {}),
  })
