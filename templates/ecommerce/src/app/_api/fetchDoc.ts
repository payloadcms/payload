import type { Config } from '../../payload/payload-types'

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
