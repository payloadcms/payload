'use client'

import type { MergeResult, MergeStreamEvent } from 'payload'

import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  formatAdminURL,
  MAIN_BRANCH,
} from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { SummarizableChange } from '../ChangeSummary/index.js'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { Radio } from '../../fields/RadioGroup/Radio/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { buildUpcomingMergeWhere } from '../../utilities/scheduleMergeHandler.js'
import { Button } from '../Button/index.js'
import { ChangeSummary } from '../ChangeSummary/index.js'
import { DatePickerField } from '../DatePicker/index.js'
import { DialogBody, DialogFooter, DialogHeader, DialogModal } from '../Dialog/index.js'
import { Link } from '../Link/index.js'
import { useModal } from '../Modal/index.js'
import { useMergeBranch } from './context.js'
import { mergeBranchModalSlug } from './slug.js'
import './index.css'

const baseClass = 'merge-branch-modal'

type MergeMode = 'now' | 'schedule'

/**
 * How many changes the modal will read to describe the merge.
 *
 * High enough to cover any branch a person is reviewing by hand, low enough that a
 * runaway branch does not turn opening this modal into a bulk read.
 */
const SUMMARY_SAMPLE_LIMIT = 200

type Progress = {
  current: number
  total: number
}

/**
 * The modal every merge entry point opens.
 *
 * Merging is a decision — what to take, and when — so it happens in a modal from
 * wherever the branch is on screen, rather than by routing somewhere first.
 *
 * The merge itself streams. A branch can hold hundreds of documents and each one
 * is a full write with hooks and validation, so "merging 34 of 230" is real
 * information rather than a spinner's decoration; see `endpoints/merge.ts` for
 * why that is a streamed response rather than a job and a polling loop.
 */
export const MergeBranchModal: React.FC = () => {
  const { closeMerge, target } = useMergeBranch()
  const { t } = useTranslation()
  const { isModalOpen } = useModal()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { serverFunction } = useServerFunctions()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [mode, setMode] = useState<MergeMode>('now')
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>()
  const [isMerging, setIsMerging] = useState(false)
  const [progress, setProgress] = useState<null | Progress>(null)
  const [countedChanges, setCountedChanges] = useState<null | number>(null)
  /** The branch's changes, read here when the opener did not already know them. */
  const [sampledChanges, setSampledChanges] = useState<null | SummarizableChange[]>(null)
  /** Set once the merge has finished, which switches the modal to its receipt. */
  const [outcome, setOutcome] = useState<MergeResult | null>(null)
  const [closeBranch, setCloseBranch] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [upcoming, setUpcoming] = useState<{ id: number | string; waitUntil: string }[]>([])

  const isOpen = isModalOpen(mergeBranchModalSlug)
  const branchSlug = target?.branchSlug
  const knownChanges = target?.changes

  // Offered only when nothing is left behind. Merging a subset means there is still
  // work on the branch by definition, so closing it would abandon that work — a
  // destructive act wearing a convenience checkbox. Computed up here because
  // `handleMergeNow` depends on it.
  const canCloseBranch = target?.selectedChangeIDs === undefined

  // Read on open rather than with the screen behind it: the switcher can be opened
  // from anywhere, and a summary nobody has asked to see is a query on every page
  // load. Skipped entirely when the opener already knows what it is merging.
  useEffect(() => {
    if (!isOpen || !branchSlug || knownChanges) {
      return
    }

    const controller = new AbortController()

    const readChanges = async () => {
      try {
        const response = await requests.get(
          formatAdminURL({ apiRoute: api, path: `/${branchChangesCollectionSlug}`, serverURL }),
          {
            params: {
              depth: 0,
              limit: SUMMARY_SAMPLE_LIMIT,
              select: { collectionSlug: true, operation: true },
              where: { branch: { equals: branchSlug } },
            },
            signal: controller.signal,
          },
        )

        const json = (await response.json()) as {
          docs?: SummarizableChange[]
          totalDocs?: number
        }

        if (typeof json?.totalDocs === 'number') {
          setCountedChanges(json.totalDocs)

          // Only when the sample is the whole set. A breakdown of the first 200 of
          // 900 changes would read as a description of the merge and be wrong about
          // it, so past that point the count says it on its own.
          setSampledChanges(json.docs?.length === json.totalDocs ? (json.docs ?? null) : null)
        }
      } catch (_err) {
        // A missing summary degrades the copy, not the action — the merge still
        // knows what it is applying.
      }
    }

    void readChanges()

    return () => controller.abort()
  }, [api, branchSlug, isOpen, knownChanges, serverURL])

  // Upcoming schedules for this branch, loaded when the schedule option is chosen
  // rather than with the modal — most merges are immediate and never ask.
  const loadUpcoming = useCallback(async () => {
    if (!branchSlug) {
      return
    }

    try {
      const response = await requests.get(
        formatAdminURL({ apiRoute: api, path: '/payload-jobs', serverURL }),
        {
          params: {
            depth: 0,
            limit: 10,
            sort: 'waitUntil',
            where: buildUpcomingMergeWhere({ branchSlug }),
          },
        },
      )

      const json = (await response.json()) as {
        docs?: { id: number | string; waitUntil?: string }[]
      }

      setUpcoming(
        (json.docs ?? [])
          .filter((doc) => Boolean(doc.waitUntil))
          .map((doc) => ({ id: doc.id, waitUntil: String(doc.waitUntil) })),
      )
    } catch (_err) {
      // A missing list costs the reader context, not the action.
    }
  }, [api, branchSlug, serverURL])

  useEffect(() => {
    if (isOpen && mode === 'schedule') {
      void loadUpcoming()
    }
  }, [isOpen, loadUpcoming, mode])

  const reset = useCallback(() => {
    setMode('now')
    setScheduledFor(undefined)
    setProgress(null)
    setOutcome(null)
    setCloseBranch(false)
    setUpcoming([])
  }, [])

  const dismiss = useCallback(() => {
    closeMerge()
    reset()
  }, [closeMerge, reset])

  const reportResult = useCallback(
    (result: MergeResult) => {
      if (result.merged.length) {
        toast.success(t('branching:mergedCount', { count: result.merged.length }))
      }

      // Blocked entries are per-document refusals, not a failed merge: the rest
      // was applied and the branch stays open for what was not.
      result.blocked.forEach(({ message }) => toast.error(message))

      if (!result.merged.length && !result.blocked.length) {
        toast.info(t('branching:noChangesYet'))
      }
    },
    [t],
  )

  const handleSchedule = useCallback(async () => {
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

      // The branch page shows nothing about a queued merge yet, but the jobs list
      // does — and the branch's own state may have been read before this.
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

  const handleCancel = useCallback(
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

  const handleMergeNow = useCallback(async () => {
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
            // Ignored server-side when changes are left behind, but not sent at all
            // when a subset is selected: the checkbox is not offered then either.
            closeBranch: canCloseBranch && closeBranch,
            stream: true,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      )

      if (!response.ok || !response.body) {
        // A non-streaming failure still returns JSON — a 403 carrying `blocked`,
        // most usefully — so read it as the result rather than a bare error.
        const json = (await response.json().catch(() => null)) as MergeResult | null

        if (json?.blocked?.length) {
          reportResult(json)
        } else {
          toast.error(t('error:unknown'))
        }

        return
      }

      const result = await readMergeStream({
        body: response.body,
        onProgress: setProgress,
      })

      if (!result) {
        // The stream ended without a terminal event, which means the connection
        // dropped mid-merge. The transaction rolls back with it, so nothing was
        // applied — but say so rather than implying success.
        toast.error(t('branching:mergeInterrupted'))

        return
      }

      if (result.type === 'error') {
        toast.error(result.message)

        return
      }

      reportResult(result.result)

      // Held open rather than dismissed. A small branch merges faster than the
      // progress bar can be read, so closing on success would make the whole
      // operation a flicker — the reader is left guessing whether it ran. The
      // completed state is the receipt, and it is dismissed deliberately.
      setOutcome(result.result)

      // The changed-documents list and the branch's status both moved. Refreshed
      // behind the modal so the page is already correct when it is dismissed.
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

  if (!target) {
    return null
  }

  const modeOptions = [
    { label: t('branching:mergeNow'), value: 'now' },
    { label: t('branching:scheduleMerge'), value: 'schedule' },
  ]

  const total = target.totalChanges ?? countedChanges ?? undefined
  const selectedCount = target.selectedChangeIDs?.length
  const summaryChanges = target.changes ?? sampledChanges

  // Three cases, in order of how much is known: a subset chosen, the whole branch
  // with a count, and the whole branch before the count lands.
  const summary =
    selectedCount !== undefined && total !== undefined
      ? t('branching:mergeSelectedOfTotal', { selected: selectedCount, total })
      : total !== undefined
        ? t('branching:mergeAllCount', { count: total })
        : t('branching:mergeAllChanges')

  const mergedCount = outcome?.merged.length ?? 0
  const isDone = Boolean(outcome)

  // Completed bar rather than a residual fraction: the last progress event fires
  // *before* the last document is applied, so it never reaches 100% on its own.
  const percentComplete = isDone
    ? 100
    : progress?.total
      ? Math.round((progress.current / progress.total) * 100)
      : 0

  return (
    <DialogModal className={baseClass} closeOnBlur={!isMerging} slug={mergeBranchModalSlug}>
      <DialogHeader
        showClose={!isMerging}
        title={
          isDone
            ? t('branching:mergeComplete')
            : t('branching:mergeBranchInto', {
                branch: target.branchName,
                target: MAIN_BRANCH,
              })
        }
      />
      <DialogBody>
        {!isDone && (
          <React.Fragment>
            <div className={`${baseClass}__intro`}>
              <p className={`${baseClass}__summary`}>{summary}</p>

              {/* The ledger: what the count is made of, which is what decides whether
                  this merge is the one the reader meant to run. */}
              {summaryChanges && <ChangeSummary changes={summaryChanges} showOperations />}

              {/* Offered only where the choice cannot be made: from the switcher,
                  which can be opened anywhere. On the changed-documents view this
                  would link back to the page the reader is already on. */}
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
                  onChange={() => setMode(option.value as MergeMode)}
                  option={option}
                  path="merge-mode"
                  readOnly={isMerging}
                />
              ))}
            </div>

            {/* Directly under the option it belongs to, and indented to it: the date
                is part of choosing "schedule", not a separate question that happens
                to appear afterwards. */}
            {mode === 'schedule' && (
              <div className={`${baseClass}__schedule`}>
                <div className={`${baseClass}__schedule-field`}>
                  {/* The same label scheduled publish puts on the same control, so
                      the two schedulers read alike. */}
                  <FieldLabel label={t('general:time')} path="merge-scheduled-for" required />
                  <DatePickerField
                    id="merge-scheduled-for"
                    minDate={new Date()}
                    onChange={(value) => setScheduledFor(value ?? undefined)}
                    pickerAppearance="dayAndTime"
                    readOnly={isScheduling}
                    value={scheduledFor}
                  />
                </div>
                <p className={`${baseClass}__schedule-help`}>{t('branching:scheduleMergeHelp')}</p>

                {/* Already-queued merges for this branch, so a second schedule is a
                    deliberate addition rather than an accidental duplicate. */}
                {upcoming.length > 0 && (
                  <div className={`${baseClass}__upcoming`}>
                    <h4 className={`${baseClass}__upcoming-title`}>
                      {t('branching:scheduledMerges')}
                    </h4>
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
                            onClick={() => void handleCancel(event.id)}
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

            {/* The GitHub move: merging does not decide the branch's fate, the
                author does — and at the moment they have the context to. */}
            {canCloseBranch && (
              <div className={`${baseClass}__close-branch`}>
                <CheckboxInput
                  checked={closeBranch}
                  id="merge-close-branch"
                  label={t('branching:closeBranchAfterMerge')}
                  onToggle={() => setCloseBranch((prev) => !prev)}
                  readOnly={isMerging}
                />
                <p className={`${baseClass}__close-branch-help`}>
                  {closeBranch
                    ? t('branching:closeBranchHelpOn')
                    : t('branching:closeBranchHelpOff')}
                </p>
              </div>
            )}
          </React.Fragment>
        )}

        {(isMerging || isDone) && (
          <div className={`${baseClass}__progress`}>
            <div className={`${baseClass}__progress-bar`}>
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
            <span className={`${baseClass}__progress-label`}>
              {isDone
                ? t('branching:mergedOfTotal', { current: mergedCount, total: mergedCount })
                : progress
                  ? t('branching:mergingProgress', {
                      current: progress.current,
                      total: progress.total,
                    })
                  : t('branching:mergeStarting')}
            </span>
          </div>
        )}

        {/* Refusals survive into the receipt: they are the reason the branch is
            still open, and a toast is gone before it can be acted on. */}
        {outcome && outcome.blocked.length > 0 && (
          <ul className={`${baseClass}__blocked`}>
            {outcome.blocked.map((each) => (
              <li key={String(each.changeID)}>{each.message}</li>
            ))}
          </ul>
        )}
      </DialogBody>
      <DialogFooter>
        {isDone ? (
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
              disabled={
                isMerging ||
                isScheduling ||
                // A schedule with no date is not a decision yet.
                (mode === 'schedule' && !scheduledFor)
              }
              onClick={() => void (mode === 'schedule' ? handleSchedule() : handleMergeNow())}
              size="medium"
            >
              {mode === 'schedule'
                ? isScheduling
                  ? t('branching:scheduling')
                  : t('branching:scheduleMerge')
                : isMerging
                  ? t('branching:merging')
                  : t('branching:merge')}
            </Button>
          </React.Fragment>
        )}
      </DialogFooter>
    </DialogModal>
  )
}

/**
 * Reads the NDJSON merge stream, returning the terminal event.
 *
 * Returns null when the stream ends without one, which is how a dropped
 * connection presents — indistinguishable from the server never finishing, and
 * treated the same way, because in both cases the transaction did not commit.
 */
const readMergeStream = async ({
  body,
  onProgress,
}: {
  body: ReadableStream<Uint8Array>
  onProgress: (progress: Progress) => void
}): Promise<Extract<MergeStreamEvent, { type: 'complete' | 'error' }> | null> => {
  const reader = body.getReader()
  const decoder = new TextDecoder()

  let buffered = ''

  const handleLine = (
    line: string,
  ): Extract<MergeStreamEvent, { type: 'complete' | 'error' }> | null => {
    const trimmed = line.trim()

    if (!trimmed) {
      return null
    }

    let event: MergeStreamEvent

    try {
      event = JSON.parse(trimmed) as MergeStreamEvent
    } catch (_err) {
      return null
    }

    if (event.type === 'progress') {
      onProgress({ current: Number(event.current), total: Number(event.total) })

      return null
    }

    return event
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffered += decoder.decode(value, { stream: true })

    // A chunk can split a line anywhere, so only whole lines are parsed and the
    // remainder is carried forward.
    const lines = buffered.split('\n')
    buffered = lines.pop() ?? ''

    for (const line of lines) {
      const terminal = handleLine(line)

      if (terminal) {
        return terminal
      }
    }
  }

  return handleLine(buffered)
}
