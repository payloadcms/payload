'use client'

import React, { useCallback, useMemo, useState } from 'react'

import type { BranchChange } from '../ChangedDocuments/index.js'
import type { MergeEvent } from '../MergeLedger/index.js'
import type { ScheduledMerge } from '../ScheduledMerges/index.js'

import { Gutter } from '../../../elements/Gutter/index.js'
import { Link } from '../../../elements/Link/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ChangedDocuments } from '../ChangedDocuments/index.js'
import { DiscardChangesButton } from '../DiscardChangesButton/index.js'
import { MergeChangesButton } from '../MergeChangesButton/index.js'
import { MergeLedger } from '../MergeLedger/index.js'
import { ScheduledMerges } from '../ScheduledMerges/index.js'

const baseClass = 'branch-changes'

/**
 * The branch's changes, and the action that applies them.
 *
 * The two live in one client component because the selection connects them: the
 * checkboxes decide what "merge" means, so the state cannot sit inside the list
 * while the button sits outside it.
 */
export const BranchChanges: React.FC<{
  branchID: number | string
  branchName: string
  branchSlug: string
  changes: BranchChange[]
  historyPage?: number
  historyTotalPages?: number
  isClosed?: boolean
  mergeEvents?: MergeEvent[]
  scheduledMerges?: ScheduledMerge[]
}> = ({
  branchID,
  branchName,
  branchSlug,
  changes,
  historyPage = 1,
  historyTotalPages = 1,
  isClosed = false,
  mergeEvents = [],
  scheduledMerges = [],
}) => {
  const { t } = useTranslation()

  // Everything selected to begin with: the common intent is to merge the branch,
  // and deselecting the exceptions is less work than selecting the rule.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(changes.map((c) => c.id)))

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === changes.length ? new Set() : new Set(changes.map((c) => c.id)),
    )
  }, [changes])

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  // Undefined when everything is selected, which the endpoint reads as "apply
  // every pending change" — the same outcome, but it keeps the merge honest if a
  // change lands between this page render and the merge.
  const selectedChangeIDs = useMemo(
    () => (selected.size === changes.length ? undefined : [...selected]),
    [changes.length, selected],
  )

  // No `reviewURL`: this is the page one would link to. The changes are already read
  // here, so the modal describes the merge without a request of its own — and it
  // describes the *selection*, which is what will actually be applied.
  const mergeTarget = useMemo(
    () => ({
      branchID,
      branchName,
      branchSlug,
      changes: changes.filter((change) => selected.has(change.id)),
      selectedChangeIDs,
      totalChanges: changes.length,
    }),
    [branchID, branchName, branchSlug, changes, selected, selectedChangeIDs],
  )

  const hasPending = changes.length > 0
  const hasHistory = mergeEvents.length > 0
  // Labelled as soon as more than one of the three is on screen; a lone section is
  // already named by the heading above it.
  const showSectionHeadings =
    [hasPending, hasHistory, scheduledMerges.length > 0].filter(Boolean).length > 1

  return (
    <React.Fragment>
      {/* Full-bleed and bordered like `doc-controls`, the bar this one sits below,
          rather than inset with the list it heads. */}
      <div className={`${baseClass}__controls`}>
        {/* Named for what the screen is, not for what happens to be on it. With
            nothing pending, this is the branch's history — a heading that describes
            the last merge event would be a caption pretending to be a title. */}
        <h2 className={`${baseClass}__title`}>
          {hasPending
            ? t('branching:reviewingChangedDocuments')
            : hasHistory
              ? t('branching:branchHistory')
              : t('branching:reviewingChangedDocuments')}
        </h2>
        {/* Closed branches take nothing further, and a branch with nothing pending
            has nothing to take — in both cases the buttons would be a dead end.
            Discard sits beside merge and is scoped by the same checkboxes: the two
            are the same decision about the same set, pointed in opposite directions. */}
        {hasPending && !isClosed && (
          <div className={`${baseClass}__actions`}>
            <DiscardChangesButton
              branchID={branchID}
              selectedChangeIDs={selectedChangeIDs}
              totalChanges={changes.length}
            />
            <MergeChangesButton disabled={!selected.size} target={mergeTarget} />
          </div>
        )}
      </div>
      <Gutter className={baseClass}>
        {/* Above everything, because it changes what the rest of the page means: the
            pending changes below are no longer only a proposal, they have a date. */}
        {scheduledMerges.length > 0 && (
          <section className={`${baseClass}__section`}>
            {showSectionHeadings && (
              <h3 className={`${baseClass}__section-title`}>{t('branching:scheduledMerges')}</h3>
            )}
            <ScheduledMerges
              branchID={branchID}
              branchSlug={branchSlug}
              schedules={scheduledMerges}
            />
          </section>
        )}

        {/* Both at once when both exist. Merging does not end a branch (§16), so a
            branch that has merged and been worked on again has two things to say —
            and replacing the history with the new work hid everything the branch had
            already done. Labelled only when both are present: with one section the
            heading above already names it. */}
        {hasPending && (
          <section className={`${baseClass}__section`}>
            {showSectionHeadings && (
              <h3 className={`${baseClass}__section-title`}>{t('branching:currentChanges')}</h3>
            )}
            {/* Only the documents this branch has touched are listed below — everything
                else on the branch is main, live, not a snapshot from when the branch was
                created. Placed here rather than as a permanent banner: it matters only
                while there is something to compare it against. */}
            <p className={`${baseClass}__untouched-note`}>
              {t('branching:untouchedDocumentsNote')}
            </p>
            <ChangedDocuments
              branch={branchSlug}
              changes={changes}
              selected={selected}
              toggleAll={toggleAll}
              toggleSelected={toggleSelected}
            />
          </section>
        )}

        {hasHistory && (
          <section className={`${baseClass}__section`}>
            {showSectionHeadings && (
              <h3 className={`${baseClass}__section-title`}>{t('branching:mergeHistory')}</h3>
            )}
            {isClosed && <p className={`${baseClass}__closed`}>{t('branching:branchClosed')}</p>}
            <MergeLedger events={mergeEvents} />
            {historyTotalPages > 1 && (
              <nav className={`${baseClass}__history-pages`}>
                <Link
                  aria-disabled={historyPage <= 1}
                  className={`${baseClass}__history-page`}
                  href={`?historyPage=${historyPage - 1}`}
                >
                  {t('general:previous')}
                </Link>
                <span className={`${baseClass}__history-position`}>
                  {t('branching:historyPageOf', { page: historyPage, total: historyTotalPages })}
                </span>
                <Link
                  aria-disabled={historyPage >= historyTotalPages}
                  className={`${baseClass}__history-page`}
                  href={`?historyPage=${historyPage + 1}`}
                >
                  {t('general:next')}
                </Link>
              </nav>
            )}
          </section>
        )}

        {!hasPending && !hasHistory && (
          <p className={`${baseClass}__empty`}>{t('branching:noChangesYet')}</p>
        )}
      </Gutter>
    </React.Fragment>
  )
}
