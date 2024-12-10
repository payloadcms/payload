import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateLoginMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    description: `${t('authentication:login')}`,
    keywords: `${t('authentication:login')}`,
    serverURL: config.serverURL,
    title: t('authentication:login'),
    ...(config.admin.meta || {}),
  })
