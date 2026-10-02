'use client'

import { MAIN_BRANCH } from 'payload/shared'
import React, { useCallback, useMemo, useState } from 'react'

import type { MergeBranchModalPhase, MergeMode } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { DialogBody, DialogFooter, DialogHeader, DialogModal } from '../Dialog/index.js'
import { useModal } from '../Modal/index.js'
import { useMergeBranch } from './context.js'
import { MergeBranchForm } from './MergeBranchForm/index.js'
import { MergeProgress } from './MergeProgress/index.js'
import { mergeBranchModalSlug } from './slug.js'
import { useBranchMergeSummary } from './useBranchMergeSummary.js'
import { useMergeBranchAction } from './useMergeBranchAction.js'
import { useScheduleBranchMerge } from './useScheduleBranchMerge.js'
import { useUpcomingBranchMerges } from './useUpcomingBranchMerges.js'
import './index.css'

const baseClass = 'merge-branch-modal'

const getModalPhase = ({
  hasOutcome,
  isMerging,
  isScheduling,
}: {
  hasOutcome: boolean
  isMerging: boolean
  isScheduling: boolean
}): MergeBranchModalPhase => {
  if (hasOutcome) {
    return 'complete'
  }

  if (isMerging) {
    return 'merging'
  }

  if (isScheduling) {
    return 'scheduling'
  }

  return 'ready'
}

export const MergeBranchModal: React.FC = () => {
  const { closeMerge, target } = useMergeBranch()
  const { t } = useTranslation()
  const { isModalOpen } = useModal()
  const [mode, setMode] = useState<MergeMode>('now')
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>()
  const [closeBranch, setCloseBranch] = useState(false)
  const isOpen = isModalOpen(mergeBranchModalSlug)
  const branchID = target?.branchID
  const knownChanges = target?.changes
  const canCloseBranch = target?.selectedChangeIDs === undefined

  const summaryHookArgs = useMemo(
    () => ({ branchID, isOpen, knownChanges }),
    [branchID, isOpen, knownChanges],
  )
  const { countedChanges, sampledChanges } = useBranchMergeSummary(summaryHookArgs)
  const upcomingHookArgs = useMemo(() => ({ branchID, isOpen, mode }), [branchID, isOpen, mode])
  const { clearUpcoming, loadUpcoming, upcoming } = useUpcomingBranchMerges(upcomingHookArgs)
  const mergeActionArgs = useMemo(
    () => ({ canCloseBranch, closeBranch, target }),
    [canCloseBranch, closeBranch, target],
  )
  const { isMerging, mergeNow, outcome, progress, resetMerge } =
    useMergeBranchAction(mergeActionArgs)

  const reset = useCallback(() => {
    setMode('now')
    setScheduledFor(undefined)
    setCloseBranch(false)
    clearUpcoming()
    resetMerge()
  }, [clearUpcoming, resetMerge])

  const dismiss = useCallback(() => {
    closeMerge()
    reset()
  }, [closeMerge, reset])

  const scheduleActionArgs = useMemo(
    () => ({
      canCloseBranch,
      closeBranch,
      dismiss,
      loadUpcoming,
      scheduledFor,
      target,
    }),
    [canCloseBranch, closeBranch, dismiss, loadUpcoming, scheduledFor, target],
  )
  const { cancelScheduledMerge, isScheduling, scheduleMerge } =
    useScheduleBranchMerge(scheduleActionArgs)

  if (!target) {
    return null
  }

  const total = target.totalChanges ?? countedChanges ?? undefined
  const selectedCount = target.selectedChangeIDs?.length
  const summaryChanges = target.changes ?? sampledChanges
  let summary = t('branching:mergeAllChanges')

  if (selectedCount !== undefined && total !== undefined) {
    summary = t('branching:mergeSelectedOfTotal', { selected: selectedCount, total })
  } else if (total !== undefined) {
    summary = t('branching:mergeAllCount', { count: total })
  }

  const phase = getModalPhase({
    hasOutcome: Boolean(outcome),
    isMerging,
    isScheduling,
  })
  const isComplete = phase === 'complete'
  const isBusy = phase === 'merging' || phase === 'scheduling'
  let title = t('branching:mergeBranchInto', {
    branch: target.branchName,
    target: MAIN_BRANCH,
  })
  let submitLabel = t('branching:merge')

  if (isComplete) {
    title = t('branching:mergeComplete')
  }

  if (phase === 'merging') {
    submitLabel = t('branching:merging')
  } else if (phase === 'scheduling') {
    submitLabel = t('branching:scheduling')
  } else if (mode === 'schedule') {
    submitLabel = t('branching:scheduleMerge')
  }

  const handleSubmit = (): void => {
    if (mode === 'schedule') {
      void scheduleMerge()
    } else {
      void mergeNow()
    }
  }

  return (
    <DialogModal className={baseClass} closeOnBlur={!isMerging} slug={mergeBranchModalSlug}>
      <DialogHeader showClose={!isMerging} title={title} />
      <DialogBody>
        {!isComplete && (
          <MergeBranchForm
            canCloseBranch={canCloseBranch}
            closeBranch={closeBranch}
            dismiss={dismiss}
            isMerging={isMerging}
            isScheduling={isScheduling}
            mode={mode}
            onCancelScheduledMerge={cancelScheduledMerge}
            onCloseBranchChange={() => setCloseBranch((previous) => !previous)}
            onModeChange={setMode}
            onScheduledForChange={setScheduledFor}
            scheduledFor={scheduledFor}
            summary={summary}
            summaryChanges={summaryChanges}
            target={target}
            upcoming={upcoming}
          />
        )}

        {(isMerging || isComplete) && <MergeProgress outcome={outcome} progress={progress} />}

        {outcome && outcome.blocked.length > 0 && (
          <ul className={`${baseClass}__blocked`}>
            {outcome.blocked.map((blockedChange) => (
              <li key={String(blockedChange.changeID)}>{blockedChange.message}</li>
            ))}
          </ul>
        )}
      </DialogBody>
      <DialogFooter>
        {isComplete ? (
          <Button buttonStyle="primary" onClick={dismiss} size="medium">
            {t('general:close')}
          </Button>
        ) : (
          <React.Fragment>
            <Button buttonStyle="secondary" disabled={isMerging} onClick={dismiss} size="medium">
              {t('general:cancel')}
            </Button>
            <Button
              buttonStyle="primary"
              disabled={isBusy || (mode === 'schedule' && !scheduledFor)}
              onClick={handleSubmit}
              size="medium"
            >
              {submitLabel}
            </Button>
          </React.Fragment>
        )}
      </DialogFooter>
    </DialogModal>
  )
}
