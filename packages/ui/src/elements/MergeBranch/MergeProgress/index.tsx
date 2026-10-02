'use client'

import type { MergeProgress as MergeProgressData, MergeResult } from 'payload'

import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'

const baseClass = 'merge-branch-modal'

export const MergeProgress: React.FC<{
  outcome: MergeResult | null
  progress: MergeProgressData | null
}> = ({ outcome, progress }) => {
  const { t } = useTranslation()
  const mergedCount = outcome?.merged.length ?? 0
  const isDone = Boolean(outcome)
  const completedProgressValue = Math.max(mergedCount, 1)
  const progressCurrent = isDone ? completedProgressValue : (progress?.current ?? 0)
  const progressTotal = isDone ? completedProgressValue : (progress?.total ?? 1)
  let percentComplete = 0
  let progressLabel = t('branching:mergeStarting')

  if (isDone) {
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
