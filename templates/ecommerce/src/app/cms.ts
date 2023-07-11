import type { Config, Footer, Header, Settings } from '../payload-types'

export const fetchDoc = async <T>(
  collection: keyof Config['collections'],
  slug: string,
): Promise<T> => {
  const doc: T = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[slug][equals]=${slug}&depth=1`,
  )
    ?.then(res => res.json())
    ?.then(({ docs }) => docs?.[0])

  return doc
}

export const fetchDocs = async <T>(collection: keyof Config['collections']): Promise<T[]> => {
  const docs: T[] = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?depth=1`,
  )
    ?.then(res => res.json())
    ?.then(res => res?.docs)

  return docs
}

export const fetchGlobals = async (): Promise<{
  settings: Settings
  header: Header
  footer: Footer
}> => {
  const [settings, header, footer]: [Settings, Header, Footer] = await Promise.all([
    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/settings`).then(res =>
      res.json(),
    ), // eslint-disable-line function-paren-newline
    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/header`).then(res =>
      res.json(),
    ), // eslint-disable-line function-paren-newline
    await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/globals/footer`).then(res =>
      res.json(),
    ), // eslint-disable-line function-paren-newline
  ])

  return {
    settings,
    header,
    footer,
  }
}
