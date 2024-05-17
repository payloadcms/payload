import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateCreateFirstUserMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  meta({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
    ...(config.admin.meta || {}),
  })
