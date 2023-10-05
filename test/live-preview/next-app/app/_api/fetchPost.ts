import { Post } from '@/payload-types'

export const fetchPost = async (slug: string): Promise<Post> => {
  return await fetch(`http://localhost:3000/api/posts?where[slug][equals]=${slug}`, {
    method: 'GET',
    cache: 'no-store',
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`Error fetching post: ${res.status} ${res.statusText}`)
        return null
      }

      return res?.json()
    })
    ?.then((res) => res?.docs?.[0])
}
