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
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?where[slug][equals]=${slug}${
      draft && payloadToken ? '&draft=true' : ''
    }`,
    {
      method: 'GET',
      // this is the key we'll use to on-demand revalidate pages that use this data
      // we do this by calling `revalidateTag()` using the same key
      // see `app/api/revalidate.ts` for more info
      next: { tags: [`pages_${slug}`] },
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
