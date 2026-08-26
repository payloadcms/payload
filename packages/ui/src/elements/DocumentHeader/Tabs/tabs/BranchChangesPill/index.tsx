'use client'

import { branchChangesCollectionSlug, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useEffect, useState } from 'react'

import { useConfig } from '../../../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../../../providers/DocumentInfo/index.js'
import { requests } from '../../../../../utilities/api.js'
import './index.css'

const baseClass = 'pill-branch-changes'

/**
 * How many documents a branch has changed.
 *
 * Counted on the client rather than threaded through `DocumentInfo`, the way the
 * version count is: the changed-document list is the branch view's whole subject,
 * so it will want live state of its own soon. When that arrives this should read
 * from it instead of issuing its own request.
 */
export const BranchChangesPill: React.FC = () => {
  const { savedDocumentData } = useDocumentInfo()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [count, setCount] = useState<null | number>(null)

  const slug = (savedDocumentData as { slug?: string } | undefined)?.slug

  useEffect(() => {
    if (!slug) {
      return
    }

    let active = true

    const query = qs.stringify(
      { depth: 0, limit: 0, where: { branch: { equals: slug } } },
      { addQueryPrefix: true },
    )

    void (async () => {
      try {
        const response = await requests.get(
          formatAdminURL({
            apiRoute: api,
            path: `/${branchChangesCollectionSlug}${query}`,
            serverURL,
          }),
        )

        if (!response.ok) {
          return
        }

        const { totalDocs } = (await response.json()) as { totalDocs?: number }

        if (active && typeof totalDocs === 'number') {
          setCount(totalDocs)
        }
      } catch (_err) {
        // A count that fails to load simply doesn't render — it is decoration on a
        // tab, not something worth surfacing an error for.
      }
    })()

    return () => {
      active = false
    }
  }, [api, serverURL, slug])

  if (count === null) {
    return null
  }

  return <span className={baseClass}>{count}</span>
}
