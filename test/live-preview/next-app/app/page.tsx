import { Page } from './page.client'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { fetchPage } from './_api/fetchPage'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const page = await fetchPage('home')

  return {
    title: page.meta?.title || page.title,
    description: page.meta?.description,
  }
}

export default async function Home() {
  const page = await fetchPage('home')

  if (!page) {
    notFound()
  }

  return <Page initialPage={page} />
}
