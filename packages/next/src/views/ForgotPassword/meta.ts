import type { GenerateViewMetadata } from '../Root/index.jsx'

import { meta } from '../../utilities/meta.js'

export const generateForgotPasswordMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) => {
  return meta({
    config,
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    title: t('authentication:forgotPassword'),
  })
}
