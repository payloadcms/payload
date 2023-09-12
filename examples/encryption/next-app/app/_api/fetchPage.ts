import type { Page } from '../../payload-types'

export const fetchPage = async (
  slug: string,
): Promise<Page | undefined | null> => {

  const pageRes: {
    docs: Page[]
  } = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[slug][equals]=${slug}`,
  ).then(res => res.json())

  return pageRes?.docs?.[0] ?? null
}
