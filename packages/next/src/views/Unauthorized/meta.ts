import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateUnauthorizedMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    serverURL: config.serverURL,
    title: t('error:unauthorized'),
    ...(config.admin.meta || {}),
  })
