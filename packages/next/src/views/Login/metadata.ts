import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateLoginViewMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  generateMetadata({
    description: `${t('authentication:login')}`,
    keywords: `${t('authentication:login')}`,
    serverURL: config.serverURL,
    title: t('authentication:login'),
    ...(config.admin.meta || {}),
  })
