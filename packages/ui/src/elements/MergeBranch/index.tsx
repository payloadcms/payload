'use client'

import type { MergeResult } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { MAIN_BRANCH } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { MergeBranchModalPhase, MergeMode } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
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
  isMerging,
  isScheduling,
  outcome,
}: {
  isMerging: boolean
  isScheduling: boolean
  outcome: MergeResult | null
}): MergeBranchModalPhase => {
  if (outcome) {
    const hasProblems = outcome.blocked.length > 0 || outcome.validationErrors.length > 0

    if (hasProblems && outcome.merged.length === 0) {
      return 'blocked'
    }

    if (hasProblems) {
      return 'partial'
    }

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
  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
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
  const { failure, isMerging, mergeNow, outcome, progress, resetMerge } =
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

  useEffect(() => {
    if (!isOpen && !isMerging && target) {
      dismiss()
    }
  }, [dismiss, isMerging, isOpen, target])

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
    isMerging,
    isScheduling,
    outcome,
  })
  const hasOutcome =
    Boolean(failure) || phase === 'blocked' || phase === 'complete' || phase === 'partial'
  const isBusy = phase === 'merging' || phase === 'scheduling'
  const problems = outcome
    ? [...outcome.blocked, ...outcome.validationErrors]
    : (failure?.validationErrors ?? [])
  let title = t('branching:mergeBranchInto', {
    branch: target.branchName,
    target: MAIN_BRANCH,
  })
  let submitLabel = t('branching:merge')

  if (failure) {
    title = t(problems.length ? 'branching:mergeBlocked' : 'general:error')
  } else if (phase === 'complete') {
    title = t('branching:mergeComplete')
  } else if (phase === 'partial') {
    title = t('branching:mergePartial')
  } else if (phase === 'blocked') {
    title = t('branching:mergeBlocked')
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
    <DialogModal
      className={baseClass}
      closeOnBlur={!isMerging}
      closeOnEsc={!isMerging}
      size="medium"
      slug={mergeBranchModalSlug}
    >
      <DialogHeader onClose={dismiss} showClose={!isMerging} title={title} />
      <DialogBody>
        {!hasOutcome && (
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

        {!failure && (isMerging || hasOutcome) && (
          <MergeProgress outcome={outcome} phase={phase} progress={progress} />
        )}

        {(failure || problems.length > 0) && (
          <div role="alert">
            {failure && <p>{failure.message}</p>}
            {!failure && Boolean(outcome?.validationErrors.length) && (
              <p>{t('error:correctInvalidFields')}</p>
            )}
            {problems.length > 0 && (
              <ul className={`${baseClass}__blocked`}>
                {problems.map((problem, index) => {
                  const entity = getEntityConfig({
                    collectionSlug: problem.collectionSlug,
                    globalSlug: problem.globalSlug,
                  })
                  const label = entity
                    ? getTranslation(
                        'labels' in entity ? entity.labels.singular : entity.label,
                        i18n,
                      )
                    : problem.collectionSlug || problem.globalSlug
                  const context = [
                    label,
                    problem.docID !== undefined && `#${problem.docID}`,
                    'locale' in problem && problem.locale,
                    'path' in problem && problem.path,
                  ]
                    .filter(Boolean)
                    .join(' / ')

                  return (
                    <li key={`${String(problem.changeID)}-${index}`}>
                      {context && <strong>{context}: </strong>}
                      {problem.message}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        {hasOutcome ? (
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
