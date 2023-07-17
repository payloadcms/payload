import type { Footer, Header, Settings } from '../../payload/payload-types'
import { FOOTER_QUERY, HEADER_QUERY, SETTINGS_QUERY } from '../_graphql/globals'

async function getSettings(): Promise<Settings> {
  const settings = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: SETTINGS_QUERY,
    }),
  })
    ?.then(res => res.json())
    ?.then(res => {
      if (res?.errors) throw new Error(res?.errors[0]?.message || 'Error fetching settings')
      return res.data?.Settings
    })

  return settings
}

async function getHeader(): Promise<Header> {
  const header = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: HEADER_QUERY,
    }),
  })
    ?.then(res => res.json())
    ?.then(res => {
      if (res?.errors) throw new Error(res?.errors[0]?.message || 'Error fetching header')
      return res.data?.Header
    })

  return header
}

async function getFooter(): Promise<Footer> {
  const footer = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: FOOTER_QUERY,
    }),
  })
    .then(res => res.json())
    ?.then(res => {
      if (res?.errors) throw new Error(res?.errors[0]?.message || 'Error fetching footer')
      return res.data?.Footer
    })

  return footer
}

export const fetchGlobals = async (): Promise<{
  settings: Settings
  header: Header
  footer: Footer
}> => {
  // initiate requests in parallel, then wait for them to resolve
  // this will eagerly start to the fetch requests at the same time
  // see https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
  const settingsData = getSettings()
  const headerData = getHeader()
  const footerData = getFooter()

  const [settings, header, footer]: [Settings, Header, Footer] = await Promise.all([
    await settingsData,
    await headerData,
    await footerData,
  ])

  return {
    settings,
    header,
    footer,
  }
}
