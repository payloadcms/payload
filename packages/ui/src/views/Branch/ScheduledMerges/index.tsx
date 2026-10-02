'use client'

import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { BranchChange } from '../ChangedDocuments/index.js'

import { Button } from '../../../elements/Button/index.js'
import { ChangeSummary } from '../../../elements/ChangeSummary/index.js'
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogModal,
} from '../../../elements/Dialog/index.js'
import { useModal } from '../../../elements/Modal/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ChangedDocuments } from '../ChangedDocuments/index.js'
import './index.css'

const baseClass = 'scheduled-merges'

export type ScheduledMerge = {
  /** The documents this schedule will apply, resolved against what is pending now. */
  changes: BranchChange[]
  closeBranch: boolean
  /** `payload-jobs` row ID, which is also the handle for cancelling it. */
  id: string
  /** True when the schedule named no selection, so it takes whatever is pending. */
  isEverything: boolean
  waitUntil: string
}

const formatWhen = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })

/**
 * What a branch is about to merge, and when.
 *
 * A banner says it in one line, because it changes what everything below it means: the
 * pending changes are no longer only a proposal, they are a proposal with a date on it.
 * Below that each schedule lists the documents it will apply, expandable to the same
 * diff the review list shows — the diff is against main either way, so it is the same
 * question asked about a future moment.
 *
 * Several schedules can coexist: schedule a merge, keep working, schedule another. The
 * banner names the soonest and the modal holds the rest, which is why actions live
 * there rather than being repeated per row.
 */
export const ScheduledMerges: React.FC<{
  branchID: number | string
  branchSlug: string
  schedules: ScheduledMerge[]
}> = ({ branchID, branchSlug, schedules }) => {
  const { t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const { serverFunction } = useServerFunctions()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const [isWorking, setIsWorking] = useState(false)

  const modalSlug = `scheduled-merges-${branchID}`
  const soonest = schedules[0]

  const handleCancel = useCallback(
    async (deleteID: string) => {
      setIsWorking(true)

      try {
        await serverFunction({ name: 'schedule-merge', args: { deleteID } })
        toast.success(t('branching:scheduleCancelled'))
        closeModal(modalSlug)
        startRouteTransition(() => router.refresh())
      } catch (_err) {
        toast.error(t('error:unknown'))
      } finally {
        setIsWorking(false)
      }
    },
    [closeModal, modalSlug, router, serverFunction, startRouteTransition, t],
  )

  if (!soonest) {
    return null
  }

  return (
    <React.Fragment>
      <div className={`${baseClass}__banner`}>
        <span className={`${baseClass}__banner-text`}>
          {t('branching:scheduledToMergeOn', { date: formatWhen(soonest.waitUntil) })}
        </span>
        <span className={`${baseClass}__banner-actions`}>
          {schedules.length > 1 && (
            <Pill pillStyle="light-gray" size="small">
              {t('branching:scheduleCount', { count: schedules.length })}
            </Pill>
          )}
          <Button buttonStyle="secondary" onClick={() => openModal(modalSlug)} size="medium">
            {t('branching:manage')}
          </Button>
        </span>
      </div>

      <div className={`${baseClass}__list`}>
        {schedules.map((schedule) => (
          <section className={`${baseClass}__schedule`} key={schedule.id}>
            <header className={`${baseClass}__schedule-header`}>
              <h4 className={`${baseClass}__when`}>{formatWhen(schedule.waitUntil)}</h4>
              <span className={`${baseClass}__meta`}>
                {schedule.isEverything
                  ? t('branching:scheduleWillApplyAll', { count: schedule.changes.length })
                  : t('branching:scheduleWillApplySelected', { count: schedule.changes.length })}
                {schedule.closeBranch ? ` · ${t('branching:closeBranchAfterMerge')}` : ''}
              </span>
            </header>

            {schedule.changes.length > 0 ? (
              // Read-only: what merges is decided, and the checkboxes on the review
              // list below are for a different, immediate decision.
              <ChangedDocuments branch={branchSlug} changes={schedule.changes} selectable={false} />
            ) : (
              // A selection whose changes were all discarded since. The job will still
              // fire and find nothing, which is harmless but worth saying.
              <p className={`${baseClass}__empty`}>{t('branching:scheduleHasNothingLeft')}</p>
            )}
          </section>
        ))}
      </div>

      {/* Cancelling is the only reason to open this, so it is the action on every row
          rather than a footer CTA — and it is destructive, so it says so. Scheduling
          another belongs to the merge modal, which is one click away on the banner. */}
      <DialogModal className={baseClass} closeOnBlur slug={modalSlug}>
        <DialogHeader showClose title={t('branching:scheduledMerges')} />
        <DialogBody>
          <ul className={`${baseClass}__manage-list`}>
            {schedules.map((schedule) => (
              <li className={`${baseClass}__manage-row`} key={schedule.id}>
                <div className={`${baseClass}__manage-details`}>
                  <span className={`${baseClass}__manage-when`}>
                    {formatWhen(schedule.waitUntil)}
                  </span>
                  <span className={`${baseClass}__meta`}>
                    {schedule.isEverything
                      ? t('branching:scheduleWillApplyAll', { count: schedule.changes.length })
                      : t('branching:scheduleWillApplySelected', {
                          count: schedule.changes.length,
                        })}
                    {schedule.closeBranch ? ` · ${t('branching:closeBranchAfterMerge')}` : ''}
                  </span>
                  {/* What is actually merging, which is the thing a date alone does not
                      say — and the reason someone opened this to cancel. */}
                  <ChangeSummary changes={schedule.changes} showOperations />
                </div>
                <Button
                  buttonStyle="destructive"
                  disabled={isWorking}
                  onClick={() => void handleCancel(schedule.id)}
                  size="medium"
                >
                  {t('branching:cancelSchedule')}
                </Button>
              </li>
            ))}
          </ul>
        </DialogBody>
        <DialogFooter>
          <Button buttonStyle="secondary" onClick={() => closeModal(modalSlug)} size="medium">
            {t('general:close')}
          </Button>
        </DialogFooter>
      </DialogModal>
    </React.Fragment>
  )
}
