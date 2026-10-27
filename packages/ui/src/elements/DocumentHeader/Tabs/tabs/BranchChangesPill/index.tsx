'use client'

import React, { useEffect, useState } from 'react'

import { useDocumentInfo } from '../../../../../providers/DocumentInfo/index.js'
import { useServerFunctions } from '../../../../../providers/ServerFunctions/index.js'
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
  const { id } = useDocumentInfo()
  const { serverFunction } = useServerFunctions()

  const [count, setCount] = useState<null | number>(null)

  useEffect(() => {
    if (id === undefined || id === null) {
      return
    }

    let isActive = true

    void (async () => {
      try {
        const { totalDocs } = (await serverFunction({
          name: 'get-branch-merge-summary',
          args: { branchID: id, sampleLimit: 1 },
        })) as { totalDocs?: number }

        if (isActive && typeof totalDocs === 'number') {
          setCount(totalDocs)
        }
      } catch (_err) {
        // A count that fails to load simply doesn't render — it is decoration on a
        // tab, not something worth surfacing an error for.
      }
    })()

    return () => {
      isActive = false
    }
  }, [id, serverFunction])

  if (count === null) {
    return null
  }

  return <span className={baseClass}>{count}</span>
}
