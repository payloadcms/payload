import { getPayloadHMR } from '@payloadcms/next/utilities'

import type { Page } from '../../../payload-types'

import config from '../../../payload.config'

export const getPage = async (slug: string): Promise<Page | null | undefined> => {
  const payload = await getPayloadHMR({ config })

  const pageRes = await payload.find({
    collection: 'pages',
    draft: true,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return pageRes?.docs?.[0] ?? null
}
