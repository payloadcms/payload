import type { Page, Product } from '@/payload-types'
import type React from 'react'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirect } from '@/utilities/getRedirect'
import { notFound, redirect } from 'next/navigation'

interface Props {
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ url }) => {
  const slug = url.startsWith('/') ? url : `${url}`

  const redirectItem = await getCachedRedirect(slug)()

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    let redirectUrl: string

    if (typeof redirectItem.to?.reference?.value === 'string') {
      const collection = redirectItem.to?.reference?.relationTo
      const id = redirectItem.to?.reference?.value

      const document = (await getCachedDocument(collection, id)()) as Page | Product
      redirectUrl = `${redirectItem.to?.reference?.relationTo !== 'pages' ? `/${redirectItem.to?.reference?.relationTo}` : ''}/${
        document?.slug
      }`
    } else {
      redirectUrl = `${redirectItem.to?.reference?.relationTo !== 'pages' ? `/${redirectItem.to?.reference?.relationTo}` : ''}/${
        redirectItem.to?.reference?.value?.slug
      }`
    }

    if (redirectUrl) redirect(redirectUrl)
  }

  return notFound()
}
