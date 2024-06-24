import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateVerifyMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    config,
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    title: t('authentication:verify'),
  })
