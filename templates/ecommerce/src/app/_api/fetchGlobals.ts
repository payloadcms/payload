import type { Footer, Header, Settings } from '../../payload/payload-types'

async function getSettings(): Promise<Settings> {
  const settings = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/settings`,
  )?.then(res => res.json())

  return settings
}

async function getHeader(): Promise<Header> {
  const header = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/header`)?.then(
    res => res.json(),
  )

  return header
}

async function getFooter(): Promise<Footer> {
  const footer = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/footer`)?.then(
    res => res.json(),
  )

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
