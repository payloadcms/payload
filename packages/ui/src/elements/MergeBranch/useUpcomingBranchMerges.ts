'use client'

import { useCallback, useEffect, useState } from 'react'

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

  const loadUpcoming = useCallback((): Promise<void> => {
    if (branchID === undefined || branchID === null) {
      return Promise.resolve()
    }

    return Promise.resolve(
      serverFunction({
        name: 'get-upcoming-branch-merges',
        args: { branchID },
      }),
    )
      .then((upcomingMerges) => {
        setUpcoming(upcomingMerges as UpcomingBranchMerge[])
      })
      .catch(() => {
        // A missing list costs context, not the scheduling action.
      })
  }, [branchID, serverFunction])

  useEffect(() => {
    if (isOpen && mode === 'schedule') {
      void loadUpcoming()
    }
  }, [isOpen, loadUpcoming, mode])

  const clearUpcoming = useCallback(() => setUpcoming([]), [])

  return { clearUpcoming, loadUpcoming, upcoming }
}
