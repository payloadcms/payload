import QueryString from 'qs'

import { PAYLOAD_SERVER_URL } from './serverURL.js'

export const fetchDoc = async <T>(args: {
  collection: string
  depth?: number
  id?: string
  slug?: string
}): Promise<T> => {
  const { id, slug, collection, depth = 2 } = args || {}

  const queryString = QueryString.stringify(
    {
      ...(slug ? { 'where[slug][equals]': slug } : {}),
      ...(depth ? { depth } : {}),
    },
    { addQueryPrefix: true },
  )

  const doc: T = await fetch(`${PAYLOAD_SERVER_URL}/api/${collection}${queryString}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching doc')
      return res?.docs?.[0]
    })

  return doc
}
