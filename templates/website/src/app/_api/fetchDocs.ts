import type { Config } from '../../payload/payload-types'
import { PAGES } from '../_graphql/pages'
import { POSTS } from '../_graphql/posts'
import { PROJECTS } from '../_graphql/projects'

const queryMap = {
  pages: {
    query: PAGES,
    key: 'Pages',
  },
  products: {
    query: PROJECTS,
    key: 'Projects',
  },
  posts: {
    query: POSTS,
    key: 'Posts',
  },
}

export const fetchDocs = async <T>(collection: keyof Config['collections']): Promise<T[]> => {
  if (!queryMap[collection]) throw new Error(`Collection ${collection} not found`)

  const docs: T[] = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: queryMap[collection].query,
    }),
  })
    ?.then(res => res.json())
    ?.then(res => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.data?.[queryMap[collection].key]?.docs
    })

  return docs
}
