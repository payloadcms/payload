import { stringify } from 'qs-esm'

import type { HTMLPopulateFn } from '../lexicalToHtml/async/types.js'

export const getRestPopulateFn: (args: {
  /**
   * E.g. `http://localhost:3000/api`
   */
  apiURL: string
  depth?: number
  draft?: boolean
  locale?: string
}) => HTMLPopulateFn = ({ apiURL, depth, draft, locale }) => {
  const populateFn: HTMLPopulateFn = async ({ id, collectionSlug, select }) => {
    const query = stringify(
      { depth: depth ?? 0, draft: draft ?? false, locale, select },
      { addQueryPrefix: true },
    )

    const res = await fetch(`${apiURL}/${collectionSlug}/${id}${query}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    }).then((res) => res.json())

    return res
  }

  return populateFn
}
