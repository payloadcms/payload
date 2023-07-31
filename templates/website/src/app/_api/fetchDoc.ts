import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import type { Config } from '../../payload/payload-types'
import { PAGE } from '../_graphql/pages'
import { POST } from '../_graphql/posts'
import { PROJECT } from '../_graphql/projects'

const queryMap = {
  pages: {
    query: PAGE,
    key: 'Pages',
  },
  projects: {
    query: PROJECT,
    key: 'Projects',
  },
  posts: {
    query: POST,
    key: 'Posts',
  },
}

export const fetchDoc = async <T>(args: {
  collection: keyof Config['collections']
  slug?: string
  id?: string
  draft?: boolean
}): Promise<T> => {
  const { collection, slug, draft } = args || {}
  let payloadToken: RequestCookie | undefined

  if (draft) {
    const { cookies } = await import('next/headers')
    payloadToken = cookies().get('payload-token')
  }

  if (!queryMap[collection]) throw new Error(`Collection ${collection} not found`)

  const doc: T = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(draft && payloadToken ? { Authorization: `JWT ${payloadToken}` } : {}),
    },
    body: JSON.stringify({
      query: queryMap[collection].query,
      variables: {
        slug,
      },
      draft: draft ?? false,
    }),
  })
    ?.then(res => res.json())
    ?.then(res => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching doc')
      return res?.data?.[queryMap[collection].key]?.docs?.[0]
    })

  return doc
}
