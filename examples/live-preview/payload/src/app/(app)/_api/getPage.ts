import { getPayloadHMR } from '@payloadcms/next/utilities'
import type { Page } from '../../../payload-types'
import config from '../../../payload.config'

export const getPage = async (slug: string): Promise<Page | undefined | null> => {
  const payload = await getPayloadHMR({ config })

  const pageRes = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: slug,
      },
    },

    limit: 1,
  })

  return pageRes?.docs?.[0] ?? null
}
