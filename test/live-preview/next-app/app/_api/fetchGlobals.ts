import type { Footer, Header } from '../../payload-types'
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

export async function fetchFooter(): Promise<Footer> {
  if (!PAYLOAD_SERVER_URL) throw new Error('PAYLOAD_SERVER_URL not found')

  const footer = await fetch(`${PAYLOAD_SERVER_URL}/api/globals/footer`, {
    method: 'GET',
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

export const fetchGlobals = async (): Promise<{
  header: Header
  footer: Footer
}> => {
  // initiate requests in parallel, then wait for them to resolve
  // this will eagerly start to the fetch requests at the same time
  // see https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
  const headerData = fetchHeader()
  const footerData = fetchFooter()

  const [header, footer]: [Header, Footer] = await Promise.all([await headerData, await footerData])

  return {
    header,
    footer,
  }
}
