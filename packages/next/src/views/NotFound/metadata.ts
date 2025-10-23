import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { generateMetadata } from '../../utilities/meta.js'

export const generateNotFoundViewMetadata = async ({
  config,
  i18n,
}: {
  config: SanitizedConfig
  i18n: I18nClient
}): Promise<Metadata> =>
  generateMetadata({
    description: i18n.t('general:pageNotFound'),
    keywords: `404 ${i18n.t('general:notFound')}`,
    serverURL: config.serverURL,
    title: i18n.t('general:notFound'),
  })
