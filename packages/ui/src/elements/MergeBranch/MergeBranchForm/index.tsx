'use client'

import React from 'react'

import type { UpcomingBranchMerge } from '../../../utilities/scheduleMergeHandler.js'
import type { SummarizableChange } from '../../ChangeSummary/index.js'
import type { MergeTarget } from '../context.js'
import type { MergeMode } from '../types.js'

import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { FieldLabel } from '../../../fields/FieldLabel/index.js'
import { Radio } from '../../../fields/RadioGroup/Radio/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { ChangeSummary } from '../../ChangeSummary/index.js'
import { DatePickerField } from '../../DatePicker/index.js'
import { Link } from '../../Link/index.js'

const baseClass = 'merge-branch-modal'

export const MergeBranchForm: React.FC<{
  canCloseBranch: boolean
  closeBranch: boolean
  dismiss: () => void
  isMerging: boolean
  isScheduling: boolean
  mode: MergeMode
  onCancelScheduledMerge: (deleteID: number | string) => Promise<void>
  onCloseBranchChange: () => void
  onModeChange: (mode: MergeMode) => void
  onScheduledForChange: (date?: Date) => void
  scheduledFor?: Date
  summary: string
  summaryChanges: null | SummarizableChange[]
  target: MergeTarget
  upcoming: UpcomingBranchMerge[]
}> = ({
  canCloseBranch,
  closeBranch,
  dismiss,
  isMerging,
  isScheduling,
  mode,
  onCancelScheduledMerge,
  onCloseBranchChange,
  onModeChange,
  onScheduledForChange,
  scheduledFor,
  summary,
  summaryChanges,
  target,
  upcoming,
}) => {
  const { t } = useTranslation()
  const modeOptions = [
    { label: t('branching:mergeNow'), value: 'now' as const },
    { label: t('branching:scheduleMerge'), value: 'schedule' as const },
  ]

  return (
    <React.Fragment>
      <div className={`${baseClass}__intro`}>
        <p className={`${baseClass}__summary`}>{summary}</p>
        {summaryChanges && <ChangeSummary changes={summaryChanges} showOperations />}

        {target.reviewURL && !isMerging && (
          <Link className={`${baseClass}__review`} href={target.reviewURL} onClick={dismiss}>
            {t('branching:mergeOnlySelected')}
          </Link>
        )}
      </div>

      <div className={`${baseClass}__modes`}>
        {modeOptions.map((option) => (
          <Radio
            id={`merge-mode-${option.value}`}
            isSelected={mode === option.value}
            key={option.value}
            onChange={() => onModeChange(option.value)}
            option={option}
            path="merge-mode"
            readOnly={isMerging}
          />
        ))}
      </div>

      {mode === 'schedule' && (
        <div className={`${baseClass}__schedule`}>
          <div className={`${baseClass}__schedule-field`}>
            <FieldLabel label={t('general:time')} path="merge-scheduled-for" required />
            <DatePickerField
              id="merge-scheduled-for"
              minDate={new Date()}
              onChange={(value) => onScheduledForChange(value ?? undefined)}
              pickerAppearance="dayAndTime"
              readOnly={isScheduling}
              value={scheduledFor}
            />
          </div>
          <p className={`${baseClass}__schedule-help`}>{t('branching:scheduleMergeHelp')}</p>

          {upcoming.length > 0 && (
            <div className={`${baseClass}__upcoming`}>
              <h4 className={`${baseClass}__upcoming-title`}>{t('branching:scheduledMerges')}</h4>
              <ul className={`${baseClass}__upcoming-list`}>
                {upcoming.map((event) => (
                  <li className={`${baseClass}__upcoming-row`} key={String(event.id)}>
                    <span>
                      {new Date(event.waitUntil).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <Button
                      buttonStyle="ghost"
                      className={`${baseClass}__upcoming-cancel`}
                      disabled={isScheduling}
                      onClick={() => void onCancelScheduledMerge(event.id)}
                    >
                      {t('general:cancel')}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {canCloseBranch && (
        <div className={`${baseClass}__close-branch`}>
          <CheckboxInput
            checked={closeBranch}
            id="merge-close-branch"
            label={t('branching:closeBranchAfterMerge')}
            onToggle={onCloseBranchChange}
            readOnly={isMerging}
          />
          <p className={`${baseClass}__close-branch-help`}>
            {closeBranch ? t('branching:closeBranchHelpOn') : t('branching:closeBranchHelpOff')}
          </p>
        </div>
      )}
    </React.Fragment>
  )
}
