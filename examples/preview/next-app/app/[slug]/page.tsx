import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Page } from '../../payload-types'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'
import { fetchDraftPage, fetchPage, fetchPages } from '../cms'

interface PageParams {
  params: { slug: string }
}

export const PageTemplate: React.FC<{ page: Page | null | undefined }> = ({ page }) => (
  <main>
    <Gutter>
      <h1>{page?.title}</h1>
      <RichText content={page?.richText} />
    </Gutter>
  </main>
)

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  const { isEnabled: isDraftMode } = draftMode()

  let page = !isDraftMode ? await fetchPage(slug) : await fetchDraftPage(slug)

  if (page === null) {
    return notFound()
  }

  return <PageTemplate page={page} />
}

export async function generateStaticParams() {
  const pages = await fetchPages()

  return pages.map(({ slug }) =>
    slug !== 'home'
      ? {
          slug,
        }
      : {},
  ) // eslint-disable-line function-paren-newline
}
