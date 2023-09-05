import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import type { Config } from '../../payload/payload-types'
import { PAGES } from '../_graphql/pages'
import { POSTS } from '../_graphql/posts'
import { PROJECTS } from '../_graphql/projects'
import { payloadToken } from './token'

const queryMap = {
  pages: {
    query: PAGES,
    key: 'Pages',
  },
  posts: {
    query: POSTS,
    key: 'Posts',
  },
  projects: {
    query: PROJECTS,
    key: 'Projects',
  },
}

export const fetchDocs = async <T>(
  collection: keyof Config['collections'],
  draft?: boolean,
  variables?: Record<string, unknown>,
): Promise<T[]> => {
  if (!queryMap[collection]) throw new Error(`Collection ${collection} not found`)

  let token: RequestCookie | undefined

  if (draft) {
    const { cookies } = await import('next/headers')
    token = cookies().get(payloadToken)
  }

  const docs: T[] = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token?.value && draft ? { Authorization: `JWT ${token.value}` } : {}),
    },
    cache: 'no-store',
    next: { tags: [collection] },
    body: JSON.stringify({
      query: queryMap[collection].query,
      variables,
    }),
  })
    ?.then(res => res.json())
    ?.then(res => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.data?.[queryMap[collection].key]?.docs
    })

  return docs
}
