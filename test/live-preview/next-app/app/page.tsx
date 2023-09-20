import { Page, type PageType } from './page.client'
import { notFound } from 'next/navigation'

export default async function Home() {
  const page: PageType = await fetch('http://localhost:3000/api/pages?where[slug][equals]=home', {
    method: 'GET',
    cache: 'no-store',
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`Error fetching page: ${res.status} ${res.statusText}`)
        notFound()
      }

      return res?.json()
    })
    ?.then((res) => res?.docs?.[0])

  if (!page) {
    notFound()
  }

  return <Page initialPage={page} />
}
