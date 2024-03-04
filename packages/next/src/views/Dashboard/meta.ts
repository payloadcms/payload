import { meta } from '../../utilities/meta'
import { GenerateViewMetadata } from '../Root'

export const generateDashboardMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) => {
  return meta({
    config,
    description: `${t('general:dashboard')} Payload`,
    keywords: `${t('general:dashboard')}, Payload`,
    title: t('general:dashboard'),
  })
}
