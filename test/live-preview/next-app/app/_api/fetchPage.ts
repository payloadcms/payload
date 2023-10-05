import { Page } from '@/payload-types'

export const fetchPage = async (slug: string): Promise<Page> => {
  return await fetch(`http://localhost:3000/api/pages?where[slug][equals]=${slug}`, {
    method: 'GET',
    cache: 'no-store',
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`Error fetching page: ${res.status} ${res.statusText}`)
        return null
      }

      return res?.json()
    })
    ?.then((res) => res?.docs?.[0])
}
