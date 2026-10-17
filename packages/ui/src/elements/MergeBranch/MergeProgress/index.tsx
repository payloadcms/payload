'use client'

import type { MergeProgress as MergeProgressData, MergeResult } from 'payload'

import React from 'react'

import type { MergeBranchModalPhase } from '../types.js'

import { useTranslation } from '../../../providers/Translation/index.js'

const baseClass = 'merge-branch-modal'

export const MergeProgress: React.FC<{
  outcome: MergeResult | null
  phase: MergeBranchModalPhase
  progress: MergeProgressData | null
}> = ({ outcome, phase, progress }) => {
  const { t } = useTranslation()
  const mergedCount = outcome?.merged.length ?? 0
  const isBlocked = phase === 'blocked'
  const isDone = phase === 'complete'
  const isPartial = phase === 'partial'
  const completedProgressValue = Math.max(mergedCount, 1)
  const progressCurrent = isDone
    ? completedProgressValue
    : isPartial
      ? mergedCount
      : (progress?.current ?? 0)
  const progressTotal = isDone
    ? completedProgressValue
    : isPartial
      ? Math.max(progress?.total ?? mergedCount, mergedCount, 1)
      : (progress?.total ?? 1)
  let percentComplete = 0
  let progressLabel = t('branching:mergeStarting')

  if (isBlocked) {
    progressLabel = t('branching:mergeBlocked')
  } else if (isPartial) {
    percentComplete = Math.round((progressCurrent / progressTotal) * 100)
    progressLabel = t('branching:mergedCount', { count: mergedCount })
  } else if (isDone) {
    percentComplete = 100
    progressLabel = t('branching:mergedOfTotal', { current: mergedCount, total: mergedCount })
  } else if (progress) {
    percentComplete = progress.total ? Math.round((progress.current / progress.total) * 100) : 0
    progressLabel = t('branching:mergingProgress', {
      current: progress.current,
      total: progress.total,
    })
  }

  return (
    <div className={`${baseClass}__progress`}>
      {!isBlocked && (
        <div
          aria-labelledby="merge-branch-progress-label"
          aria-valuemax={progressTotal}
          aria-valuemin={0}
          aria-valuenow={progressCurrent}
          aria-valuetext={progressLabel}
          className={`${baseClass}__progress-bar`}
          role="progressbar"
        >
          <div
            className={[
              `${baseClass}__progress-fill`,
              isDone && `${baseClass}__progress-fill--complete`,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      )}
      <span
        aria-live="polite"
        className={`${baseClass}__progress-label`}
        id="merge-branch-progress-label"
        role="status"
      >
        {progressLabel}
      </span>
    </div>
  )
}
