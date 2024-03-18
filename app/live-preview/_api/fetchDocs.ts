import { PAYLOAD_SERVER_URL } from './serverURL.js'

export const fetchDocs = async <T>(collection: string): Promise<T[]> => {
  const docs: T[] = await fetch(`${PAYLOAD_SERVER_URL}/api/${collection}?depth=0&limit=100`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.docs
    })

  return docs
}
