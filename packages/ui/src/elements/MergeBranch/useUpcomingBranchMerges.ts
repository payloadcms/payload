'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { UpcomingBranchMerge } from '../../utilities/scheduleMergeHandler.js'
import type { MergeMode } from './types.js'

import { useServerFunctions } from '../../providers/ServerFunctions/index.js'

export const useUpcomingBranchMerges = ({
  branchID,
  isOpen,
  mode,
}: {
  branchID?: number | string
  isOpen: boolean
  mode: MergeMode
}): {
  clearUpcoming: () => void
  loadUpcoming: () => Promise<void>
  upcoming: UpcomingBranchMerge[]
} => {
  const { serverFunction } = useServerFunctions()
  const [upcoming, setUpcoming] = useState<UpcomingBranchMerge[]>([])

  const requestVersion = useRef(0)

  const loadUpcoming = useCallback((): Promise<void> => {
    if (branchID === undefined || branchID === null) {
      return Promise.resolve()
    }

    const version = ++requestVersion.current

    return Promise.resolve(
      serverFunction({
        name: 'get-upcoming-branch-merges',
        args: { branchID },
      }),
    )
      .then((upcomingMerges) => {
        if (version === requestVersion.current) {
          setUpcoming(upcomingMerges as UpcomingBranchMerge[])
        }
      })
      .catch(() => {
        // A missing list costs context, not the scheduling action.
      })
  }, [branchID, serverFunction])

  const clearUpcoming = useCallback(() => {
    requestVersion.current += 1
    setUpcoming([])
  }, [])

  useEffect(() => {
    clearUpcoming()

    if (isOpen && mode === 'schedule') {
      void loadUpcoming()
    }

    return () => {
      requestVersion.current += 1
    }
  }, [clearUpcoming, isOpen, loadUpcoming, mode])

  return { clearUpcoming, loadUpcoming, upcoming }
}
