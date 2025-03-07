import type { MetaConfig } from 'payload'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateCreateFirstUserViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  generateMetadata({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
    ...((config.admin.meta || {}) as MetaConfig),
  })
