import { meta } from '../../utilities/meta'
import { GenerateViewMetadata } from '../Root'

export const generateLoginMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) => {
  return meta({
    config,
    description: `${t('authentication:login')}`,
    keywords: `${t('authentication:login')}`,
    title: t('authentication:login'),
  })
}
