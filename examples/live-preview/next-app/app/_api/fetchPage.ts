import type { Page } from '../../payload-types'

export const fetchPage = async (slug: string): Promise<Page | undefined | null> => {
  const pageRes: {
    docs: Page[]
  } = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?where[slug][equals]=${slug}&depth=2`,
    {
      method: 'GET',
    },
  ).then(res => res.json())

  return pageRes?.docs?.[0] ?? null
}
