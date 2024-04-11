import type { Comment, Post, User } from '../../payload-types'

import { COMMENTS_BY_DOC, COMMENTS_BY_USER } from '../_graphql/comments'
import { GRAPHQL_API_URL } from './shared'

export const fetchComments = async (args: {
  doc?: Post['id']
  user?: User['id']
}): Promise<Comment[]> => {
  const { doc, user } = args || {}

  const docs: Comment[] = await fetch(`${GRAPHQL_API_URL}/api/graphql`, {
    body: JSON.stringify({
      query: user ? COMMENTS_BY_USER : COMMENTS_BY_DOC,
      variables: {
        doc,
        user,
      },
    }),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    ?.then((res) => res.json())
    ?.then((res) => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.data?.Comments?.docs
    })

  return docs
}
