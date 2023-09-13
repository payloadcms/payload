import { Metadata, ResolvingMetadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { Media } from '../../payload-types'
import { ContentLayout } from '../_components/content/contentLayout'
import { fetchPage } from '../_utils/api'
import { parsePreviewOptions } from '../_utils/preview'

interface LandingPageProps {
  params: {
    slug: string
  }
  searchParams: Record<string, string>
}

export async function generateMetadata(
  { searchParams, params }: LandingPageProps,
  parent?: ResolvingMetadata,
): Promise<Metadata> {
  const defaultTitle = (await parent)?.title?.absolute
  const options = parsePreviewOptions(searchParams)
  const page = await fetchPage(params.slug, options)

  const title = page?.meta?.title || defaultTitle
  const description = page?.meta?.description || 'A portfolio of work by a digital professional.'
  const images = []
  if (page?.meta?.image) {
    images.push((page.meta.image as Media).url)
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
  }
}

const LandingPage = async ({ params, searchParams }: LandingPageProps) => {
  const { slug } = params
  const options = parsePreviewOptions(searchParams)
  const page = await fetchPage(slug, options)

  if (!page?.layout) {
    notFound()
  }

  return <ContentLayout layout={page.layout} className="mt-16" />
}

export default LandingPage
