import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { meta } from '../../utilities/meta.js'

export const generateNotFoundMeta = async ({
  config,
  i18n,
}: {
  config: SanitizedConfig
  i18n: I18n
}): Promise<Metadata> =>
  meta({
    description: i18n.t('general:pageNotFound'),
    keywords: `404 ${i18n.t('general:notFound')}`,
    serverURL: config.serverURL,
    title: i18n.t('general:notFound'),
  })
