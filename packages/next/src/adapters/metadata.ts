import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { generatePageMetadata as generateMetadata } from '@payloadcms/ui/views/Root/generatePageMetadata'
import { connection } from 'next/server.js'

import { getNextRequestI18n } from '../utilities/getNextRequestI18n.js'
import { adminViews } from './views.js'

type Args = {
  config: Promise<SanitizedConfig>
  params: Promise<{
    [key: string]: string | string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generatePageMetadata = async ({
  config: configPromise,
  params: paramsPromise,
}: Args): Promise<Metadata> => {
  if (process.env.PAYLOAD_CACHE_COMPONENTS_ENABLED === 'true') {
    await connection()
  }

  const config = await configPromise
  const params = await paramsPromise
  const i18n = await getNextRequestI18n({ config })

  const metadata = await generateMetadata({ adminViews, config, i18n, params })

  return metadata as unknown as Metadata
}
