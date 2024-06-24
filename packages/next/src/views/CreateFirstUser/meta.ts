import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateCreateFirstUserMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  meta({
    config,
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    title: t('authentication:createFirstUser'),
  })
