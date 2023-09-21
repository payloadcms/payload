import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

import { Media, Page } from '../../payload/payload-types'
import { staticHome } from '../../payload/seed/home-static'
import { ContentLayout } from '../_components/content/contentLayout'
import { fetchPage, fetchPages } from '../_utils/api'
import { parsePreviewOptions } from '../_utils/preview'

// Payload Cloud caches all files through Cloudflare, so we don't need Next.js to cache them as well
// This means that we can turn off Next.js data caching and instead rely solely on the Cloudflare CDN
// To do this, we include the `no-cache` header on the fetch requests used to get the data for this page
// But we also need to force Next.js to dynamically render this page on each request for preview mode to work
// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
// If you are not using Payload Cloud then this line can be removed, see `../../../README.md#cache`
export const dynamic = 'force-dynamic'

interface LandingPageProps {
  params: {
    slug: string
  }
  searchParams: Record<string, string>
}

export default async function LandingPage({ params, searchParams }: LandingPageProps) {
  const { slug } = params
  const options = parsePreviewOptions(searchParams)

  let page: Page | null = null

  try {
    page = await fetchPage(slug, options)
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  // if no `home` page exists, render a static one using dummy content
  // you should delete this code once you have a home page in the CMS
  // this is really only useful for those who are demoing this template
  if (!page) {
    page = staticHome
  }

  if (!page) {
    return notFound()
  }

  return <ContentLayout layout={page.layout} className="mt-16" />
}

export async function generateStaticParams() {
  try {
    const pages = await fetchPages()
    return pages.map(({ slug }) => ({ params: { slug } }))
  } catch (error) {
    return []
  }
}

export async function generateMetadata(
  { params, searchParams }: LandingPageProps,
  parent?: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = params
  const options = parsePreviewOptions(searchParams)

  let page: Page | null = null

  try {
    page = await fetchPage(slug, options)
  } catch (error) {
    // don't throw an error if the fetch fails
    // this is so that we can render a static home page for the demo
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // in production you may want to redirect to a 404  page or at least log the error somewhere
  }

  const defaultTitle = (await parent)?.title?.absolute
  const title = page?.meta?.title || defaultTitle
  const description = page?.meta?.description || 'A portfolio of work by a digital professional.'
  const images = []

  if (page?.meta?.image) {
    images.push((page.meta.image as Media).url)
  }

  if (!page) {
    page = staticHome
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
