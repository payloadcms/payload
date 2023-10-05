import type { Header } from '../../payload-types'
import { PAYLOAD_SERVER_URL } from '../api'

export async function fetchHeader(): Promise<Header> {
  if (!PAYLOAD_SERVER_URL) throw new Error('PAYLOAD_SERVER_URL not found')

  const header = await fetch(`${PAYLOAD_SERVER_URL}/api/globals/header`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    ?.then((res) => {
      if (!res.ok) throw new Error('Error fetching doc')
      return res.json()
    })
    ?.then((res) => {
      if (res?.errors) throw new Error(res?.errors[0]?.message || 'Error fetching header')
      return res
    })

  return header
}
