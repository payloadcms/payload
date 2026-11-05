import { stringify } from 'qs-esm'

import type { HTMLPopulateArguments, HTMLPopulateFn } from '../lexicalToHtml/async/types.js'

export const getRestPopulateFn: (args: {
  /**
   * E.g. `http://localhost:3000/api`
   */
  apiURL: string
  depth?: number
  draft?: boolean
  locale?: string
}) => HTMLPopulateFn = ({ apiURL, depth, draft, locale }) => {
  const populateFn: HTMLPopulateFn = async <TData extends object>({
    id,
    collectionSlug,
    select,
  }: HTMLPopulateArguments) => {
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
    })

    // A missing or unreadable document answers with an error body, not the document
    if (!res.ok) {
      return undefined
    }

    return (await res.json()) as TData
  }

  return populateFn
}
