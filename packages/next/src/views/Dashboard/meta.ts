import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateDashboardMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    config,
    description: `${t('general:dashboard')} Payload`,
    keywords: `${t('general:dashboard')}, Payload`,
    title: t('general:dashboard'),
  })
