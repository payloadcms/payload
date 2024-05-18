import type React from 'react'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirect } from '@/utilities/getRedirect'
import { redirect } from 'next/navigation'

interface Props {
  url: string
}

export const PayloadRedirects: React.FC<Props> = async ({ url }) => {
  const slug = url.startsWith('/') ? url : `${url}`

  const cachedRedirect = getCachedRedirect(slug)
  const redirectItem = await cachedRedirect()

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    } else if (
      redirectItem.to?.reference?.value &&
      typeof redirectItem.to?.reference?.value === 'string' &&
      redirectItem.to?.reference?.relationTo &&
      typeof redirectItem.to?.reference?.relationTo === 'string'
    ) {
      const collection = redirectItem.to?.reference?.relationTo
      const id = redirectItem.to?.reference?.relationTo
      const cachedDocument = getCachedDocument(collection, id)

      const document = await cachedDocument()

      if ('slug' in document && document.slug) {
        redirect(document.slug)
      }
    }
  }

  return null
}
