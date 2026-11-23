import type React from 'react'

import configPromise from '@payload-config'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

interface Props {
  disableNotFound?: boolean
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = await getCachedRedirects()()

  const redirectItem = redirects.find((redirect) => redirect.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    const reference = redirectItem.to?.reference

    if (reference) {
      const payload = await getPayload({ config: configPromise })
      const document =
        typeof reference.value === 'object'
          ? reference.value
          : await payload.findByID({
              id: reference.value,
              collection: reference.relationTo,
              depth: 0,
              disableErrors: true,
            })

      const redirectUrl = document
        ? await payload.generateFrontendPath({ collection: reference.relationTo, doc: document })
        : null

      if (redirectUrl) redirect(redirectUrl)
    }
  }

  if (disableNotFound) return null

  notFound()
}
