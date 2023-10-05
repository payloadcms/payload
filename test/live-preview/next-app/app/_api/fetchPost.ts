import { Post } from '@/payload-types'
import { PAYLOAD_SERVER_URL } from './serverURL'

export const fetchPost = async (slug: string): Promise<Post> => {
  return await fetch(`${PAYLOAD_SERVER_URL}/api/posts?where[slug][equals]=${slug}`, {
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
