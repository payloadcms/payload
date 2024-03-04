import { meta } from '../../utilities/meta'
import { GenerateViewMetadata } from '../Root'

export const generateAccountMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) => {
  return meta({
    config,
    description: `${t('authentication:accountOfCurrentUser')}`,
    keywords: `${t('authentication:account')}`,
    title: t('authentication:account'),
  })
}
