import type { GenerateViewMetadata } from '../Root/index.d.ts'

import { meta } from '../../utilities/meta.js'

export const generateUnauthorizedMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) => {
  return meta({
    config,
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    title: t('error:unauthorized'),
  })
}
