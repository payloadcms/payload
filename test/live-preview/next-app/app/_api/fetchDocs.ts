import type { Config } from '../../payload-types'
import { PAYLOAD_SERVER_URL } from './serverURL'

export const fetchDocs = async <T>(collection: keyof Config['collections']): Promise<T[]> => {
  const docs: T[] = await fetch(`${PAYLOAD_SERVER_URL}/api/${collection}?depth=0&limit=100`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.docs
    })

  return docs
}
