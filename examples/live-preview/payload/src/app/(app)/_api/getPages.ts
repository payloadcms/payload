import type { Page } from '../../payload-types'

export const getPages = async (): Promise<Page[]> => {
  const payload = await getPayloadHMR({ config })

  const pagesRes = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 100,
  })

  return pagesRes?.docs ?? []
}
