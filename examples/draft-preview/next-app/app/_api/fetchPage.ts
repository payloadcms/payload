import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import type { Page } from '../../payload-types'

export const fetchPage = async (
  slug: string,
  draft?: boolean,
): Promise<Page | undefined | null> => {
  let payloadToken: RequestCookie | undefined

  if (draft) {
    const { cookies } = await import('next/headers')
    payloadToken = cookies().get('payload-token')
  }

  const pageRes: {
    docs: Page[]
  } = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[slug][equals]=${slug}${
      draft && payloadToken ? '&draft=true' : ''
    }`,
    {
      ...(draft && payloadToken
        ? {
            headers: {
              Authorization: `JWT ${payloadToken?.value}`,
            },
          }
        : {}),
    },
  ).then(res => res.json())

  return pageRes?.docs?.[0] ?? null
}
