import { getPage } from './api'
import { Page } from './page.client'
import { notFound } from 'next/navigation'

export default async function Home() {
  const page = await getPage('home')

  if (page) {
    notFound()
  }

  return <Page initialPage={page} />
}
