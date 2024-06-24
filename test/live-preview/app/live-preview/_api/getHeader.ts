import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'

import type { Header } from '../../../payload-types.js'

export async function getHeader(): Promise<Header> {
  const payload = await getPayloadHMR({ config })

  try {
    const header = await payload.findGlobal({
      slug: 'header',
    })

    return header as Header
  } catch (err) {
    console.error(err)
  }

  throw new Error('Error getting header.')
}
