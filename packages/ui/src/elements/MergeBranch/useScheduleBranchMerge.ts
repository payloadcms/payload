'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { MergeTarget } from './context.js'

import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

export const useScheduleBranchMerge = ({
  canCloseBranch,
  closeBranch,
  dismiss,
  loadUpcoming,
  scheduledFor,
  target,
}: {
  canCloseBranch: boolean
  closeBranch: boolean
  dismiss: () => void
  loadUpcoming: () => Promise<void>
  scheduledFor?: Date
  target: MergeTarget | null
}): {
  cancelScheduledMerge: (deleteID: number | string) => Promise<void>
  isScheduling: boolean
  scheduleMerge: () => Promise<void>
} => {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { serverFunction } = useServerFunctions()
  const { t } = useTranslation()
  const [isScheduling, setIsScheduling] = useState(false)

  const scheduleMerge = useCallback(async () => {
    if (!target || !scheduledFor || isScheduling) {
      return
    }

    setIsScheduling(true)

    try {
      const result = (await serverFunction({
        name: 'schedule-merge',
        args: {
          branchID: target.branchID,
          changes: target.selectedChangeIDs,
          closeBranch: canCloseBranch && closeBranch,
          date: scheduledFor,
        },
      })) as { error?: string }

      if (result?.error) {
        toast.error(result.error)

        return
      }

      toast.success(
        t('branching:mergeScheduledFor', {
          date: scheduledFor.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        }),
      )

      dismiss()
      startRouteTransition(() => router.refresh())
    } catch (_err) {
      toast.error(t('error:unknown'))
    } finally {
      setIsScheduling(false)
    }
  }, [
    canCloseBranch,
    closeBranch,
    dismiss,
    isScheduling,
    router,
    scheduledFor,
    serverFunction,
    startRouteTransition,
    t,
    target,
  ])

  const cancelScheduledMerge = useCallback(
    async (deleteID: number | string) => {
      setIsScheduling(true)

      try {
        await serverFunction({ name: 'schedule-merge', args: { deleteID } })
        await loadUpcoming()
        toast.success(t('general:deletedSuccessfully'))
      } catch (_err) {
        toast.error(t('error:unknown'))
      } finally {
        setIsScheduling(false)
      }
    },
    [loadUpcoming, serverFunction, t],
  )

  return { cancelScheduledMerge, isScheduling, scheduleMerge }
}
