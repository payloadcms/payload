import QueryString from 'qs'
import type { Config } from '../../payload-types'
import { PAYLOAD_SERVER_URL } from './serverURL'

export const fetchDoc = async <T>(args: {
  collection: keyof Config['collections']
  slug?: string
  id?: string
  depth?: number
}): Promise<T> => {
  const { collection, slug, id, depth = 2 } = args || {}

  const queryString = QueryString.stringify(
    {
      ...(slug ? { 'where[slug][equals]': slug } : {}),
      ...(depth ? { depth } : {}),
    },
    { addQueryPrefix: true },
  )

  const doc: T = await fetch(`${PAYLOAD_SERVER_URL}/api/${collection}${queryString}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching doc')
      return res?.docs?.[0]
    })

  return doc
}
