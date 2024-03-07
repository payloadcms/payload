import type { GenerateViewMetadata } from '../Root/index.d.ts'

import { meta } from '../../utilities/meta.js'

export const generateDashboardMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) => {
  return meta({
    config,
    description: `${t('general:dashboard')} Payload`,
    keywords: `${t('general:dashboard')}, Payload`,
    title: t('general:dashboard'),
  })
}
