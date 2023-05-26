import { draftMode } from 'next/headers'

import { PageTemplate } from '../../[slug]/page'
import { fetchDraftPage } from '../../cms'

// NOTE: there is a known bug in development mode when mixing dynamic and static exports
// it will throw an error during navigation, but this does not effect production builds
// what is happening is draft mode conditionally renders the draft page component, a dynamic page that reads cookies
// the fix here is to explicitly set `force-dynamic`, indicating to the compiler that this is intentional
// but unfortunately there is no known workaround for development mode
// - https://github.com/vercel/next.js/issues/42991
// - https://github.com/vercel/next.js/discussions/50399
export const dynamic = 'force-dynamic'

interface PageParams {
  params: { slug: string }
}

export default async function DraftPage({ params: { slug } }: PageParams) {
  const { isEnabled: isDraftMode } = draftMode()

  if (!isDraftMode) {
    return null
  }

  const page = await fetchDraftPage(slug || 'home')

  if (page === null) {
    return null
  }

  return <PageTemplate page={page} />
}
