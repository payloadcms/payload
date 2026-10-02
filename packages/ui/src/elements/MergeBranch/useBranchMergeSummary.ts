'use client'

import { useEffect, useState } from 'react'

import type { BranchMergeSummary } from '../../utilities/scheduleMergeHandler.js'
import type { SummarizableChange } from '../ChangeSummary/index.js'

import { useServerFunctions } from '../../providers/ServerFunctions/index.js'

const summarySampleLimit = 200

export const useBranchMergeSummary = ({
  branchID,
  isOpen,
  knownChanges,
}: {
  branchID?: number | string
  isOpen: boolean
  knownChanges?: SummarizableChange[]
}): {
  countedChanges: null | number
  sampledChanges: null | SummarizableChange[]
} => {
  const { serverFunction } = useServerFunctions()
  const [countedChanges, setCountedChanges] = useState<null | number>(null)
  const [sampledChanges, setSampledChanges] = useState<null | SummarizableChange[]>(null)

  useEffect(() => {
    if (!isOpen || branchID === undefined || branchID === null || knownChanges) {
      return
    }

    let isCancelled = false

    const readChanges = async () => {
      try {
        const summary = (await serverFunction({
          name: 'get-branch-merge-summary',
          args: { branchID, sampleLimit: summarySampleLimit },
        })) as BranchMergeSummary

        if (!isCancelled && typeof summary?.totalDocs === 'number') {
          setCountedChanges(summary.totalDocs)
          setSampledChanges(
            summary.docs?.length === summary.totalDocs ? (summary.docs ?? null) : null,
          )
        }
      } catch (_err) {
        // A missing summary degrades the copy, not the merge action.
      }
    }

    void readChanges()

    return () => {
      isCancelled = true
    }
  }, [branchID, isOpen, knownChanges, serverFunction])

  return { countedChanges, sampledChanges }
}
