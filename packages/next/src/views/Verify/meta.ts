import { meta } from '../../utilities/meta'
import { GenerateViewMetadata } from '../Root'

export const generateVerifyMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) => {
  return meta({
    config,
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    title: t('authentication:verify'),
  })
}
