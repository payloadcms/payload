import { getPayloadHMR } from '@payloadcms/next/utilities'

import type { Page } from '../../../payload-types'

import config from '../../../payload.config'

export const getGlobal = async (slug: string): Promise<Page | null | undefined> => {
  const payload = await getPayloadHMR({ config })

  const globalRes = await payload.findGlobal({
    slug,
    depth: 0,
  })

  return globalRes ?? null
}
