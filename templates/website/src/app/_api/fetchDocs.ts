import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import type { Config } from '../../payload-types'

import { PAGES } from '../_graphql/pages'
import { POSTS } from '../_graphql/posts'
import { PROJECTS } from '../_graphql/projects'
import { GRAPHQL_API_URL } from './shared'
import { payloadToken } from './token'

const queryMap = {
  pages: {
    key: 'Pages',
    query: PAGES,
  },
  posts: {
    key: 'Posts',
    query: POSTS,
  },
  projects: {
    key: 'Projects',
    query: PROJECTS,
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

  const docs: T[] = await fetch(`${GRAPHQL_API_URL}/api/graphql`, {
    body: JSON.stringify({
      query: queryMap[collection].query,
      variables,
    }),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token?.value && draft ? { Authorization: `JWT ${token.value}` } : {}),
    },
    method: 'POST',
    next: { tags: [collection] },
  })
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.data?.[queryMap[collection].key]?.docs
    })

  return docs
}
