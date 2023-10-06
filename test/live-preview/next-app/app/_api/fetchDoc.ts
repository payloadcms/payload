import type { Config } from '../../payload-types'
import { PAYLOAD_SERVER_URL } from './serverURL'

export const fetchDoc = async <T>(args: {
  collection: keyof Config['collections']
  slug?: string
  id?: string
}): Promise<T> => {
  const { collection, slug, id } = args || {}

  const doc: T = await fetch(
    `${PAYLOAD_SERVER_URL}/api/${collection}${id ? `/${id}` : ''}${
      slug ? `?where[slug][equals]=${slug}` : ''
    }`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching doc')
      return res?.docs?.[0]
    })

  return doc
}
