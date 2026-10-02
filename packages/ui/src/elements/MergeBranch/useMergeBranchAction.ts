'use client'

import type { MergeProgress, MergeResult } from 'payload'

import { branchesCollectionSlug, formatAdminURL } from 'payload/shared'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { MergeTarget } from './context.js'

import { useConfig } from '../../providers/Config/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { readMergeStream } from './readMergeStream.js'

export const useMergeBranchAction = ({
  canCloseBranch,
  closeBranch,
  target,
}: {
  canCloseBranch: boolean
  closeBranch: boolean
  target: MergeTarget | null
}): {
  isMerging: boolean
  mergeNow: () => Promise<void>
  outcome: MergeResult | null
  progress: MergeProgress | null
  resetMerge: () => void
} => {
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { t } = useTranslation()
  const [isMerging, setIsMerging] = useState(false)
  const [progress, setProgress] = useState<MergeProgress | null>(null)
  const [outcome, setOutcome] = useState<MergeResult | null>(null)

  const reportResult = useCallback(
    (result: MergeResult) => {
      if (result.merged.length) {
        toast.success(t('branching:mergedCount', { count: result.merged.length }))
      }

      result.blocked.forEach(({ message }) => toast.error(message))

      if (!result.merged.length && !result.blocked.length) {
        toast.info(t('branching:noChangesYet'))
      }
    },
    [t],
  )

  const mergeNow = useCallback(async () => {
    if (!target || isMerging) {
      return
    }

    setIsMerging(true)
    setProgress(null)

    try {
      const response = await fetch(
        formatAdminURL({
          apiRoute: api,
          path: `/${branchesCollectionSlug}/${target.branchID}/merge`,
          serverURL,
        }),
        {
          body: JSON.stringify({
            changes: target.selectedChangeIDs,
            closeBranch: canCloseBranch && closeBranch,
            stream: true,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      )

      if (!response.ok || !response.body) {
        const result = (await response.json().catch(() => null)) as MergeResult | null

        if (result?.blocked?.length) {
          reportResult(result)
        } else {
          toast.error(t('error:unknown'))
        }

        return
      }

      const result = await readMergeStream({ body: response.body, onProgress: setProgress })

      if (!result) {
        toast.error(t('branching:mergeInterrupted'))

        return
      }

      if (result.type === 'error') {
        toast.error(result.message)

        return
      }

      reportResult(result.result)
      setOutcome(result.result)
      startRouteTransition(() => router.refresh())
    } catch (_err) {
      toast.error(t('error:unknown'))
    } finally {
      setIsMerging(false)
    }
  }, [
    api,
    canCloseBranch,
    closeBranch,
    isMerging,
    reportResult,
    router,
    serverURL,
    startRouteTransition,
    t,
    target,
  ])

  const resetMerge = useCallback(() => {
    setProgress(null)
    setOutcome(null)
  }, [])

  return { isMerging, mergeNow, outcome, progress, resetMerge }
}
