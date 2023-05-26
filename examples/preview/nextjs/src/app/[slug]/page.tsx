import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { fetchPage, fetchPages } from '../cms'

import { Gutter } from '@/components/Gutter'
import RichText from '@/components/RichText'
import { Page } from '@/payload-types'

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

export default async function Page({ params: { slug } }: PageParams) {
  const { isEnabled: isDraftMode } = draftMode()

  if (isDraftMode) {
    return null
  }

  const page = await fetchPage(slug || 'home')

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
