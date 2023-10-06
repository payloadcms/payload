import type { Footer } from '../../payload-types'
import { PAYLOAD_SERVER_URL } from './serverURL'

export async function fetchFooter(): Promise<Footer> {
  if (!PAYLOAD_SERVER_URL) throw new Error('PAYLOAD_SERVER_URL not found')

  const footer = await fetch(`${PAYLOAD_SERVER_URL}/api/globals/footer`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error('Error fetching doc')
      return res.json()
    })
    ?.then((res) => {
      if (res?.errors) throw new Error(res?.errors[0]?.message || 'Error fetching footer')
      return res
    })

  return footer
}
