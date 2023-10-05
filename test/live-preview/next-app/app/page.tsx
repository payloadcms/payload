import { getPage } from './api'
import { Page } from './page.client'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const page = await getPage('home')

  return {
    title: page.title,
    description: page.description,
  }
}

export default async function Home() {
  const page = await getPage('home')

  if (!page) {
    notFound()
  }

  return <Page initialPage={page} />
}
