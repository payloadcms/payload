import type { Config } from '../../payload/payload-types'

export const fetchDocs = async <T>(collection: keyof Config['collections']): Promise<T[]> => {
  const docs: T[] = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?depth=1`,
  )
    ?.then(res => res.json())
    ?.then(res => res?.docs)

  return docs
}
