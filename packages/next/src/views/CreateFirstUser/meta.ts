import { meta } from '../../utilities/meta'
import { GenerateViewMetadata } from '../Root'

export const generateCreateFirstUserMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) => {
  return meta({
    config,
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    title: t('authentication:createFirstUser'),
  })
}
