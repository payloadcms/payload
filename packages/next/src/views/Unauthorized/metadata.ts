import type { MetaConfig } from 'payload'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateUnauthorizedViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  generateMetadata({
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    serverURL: config.serverURL,
    title: t('error:unauthorized'),
    ...((config.admin.meta || {}) as MetaConfig),
  })
