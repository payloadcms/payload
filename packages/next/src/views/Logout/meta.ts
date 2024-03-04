import { meta } from '../../utilities/meta'
import { GenerateViewMetadata } from '../Root'

export const generateLogoutMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) => {
  return meta({
    config,
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    title: t('authentication:logout'),
  })
}
