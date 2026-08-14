import type { DocumentViewServerProps } from 'payload'

import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
} from 'payload/shared'
import React from 'react'

import type { BranchChange } from './ChangedDocuments/index.js'
import type { MergeEvent } from './MergeLedger/index.js'
import type { ScheduledMerge } from './ScheduledMerges/index.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { BranchChanges } from '../../exports/client/index.js'
import { buildUpcomingMergeWhere } from '../../utilities/scheduleMergeHandler.js'
import { SetDocumentStepNav } from '../Edit/SetDocumentStepNav/index.js'
import './index.css'

/** Small: each event lists every document it merged, so pages grow with the events. */
const MERGE_HISTORY_PAGE_SIZE = 5

/**
 * The default view for a branch: what the branch has changed, ready to review and
 * merge.
 *
 * This is the default rather than the branch's own form because the form is
 * incidental — a name and a description — while the changes are the reason the
 * branch exists. The form lives one click away at `/manage`.
 *
 * Only the change registry is read here. Each document's diff is fetched by the
 * client as its row is opened or approached, because a branch can hold hundreds
 * and rendering every field tree up front would dominate the page load.
 */
export async function BranchChangesView(props: DocumentViewServerProps) {
  const {
    initPageResult: {
      collectionConfig,
      docID: branchID,
      req,
      req: { i18n, payload },
    },
  } = props

  const branch = branchID
    ? await payload.findByID({
        id: branchID,
        collection: branchesCollectionSlug,
        depth: 0,
        overrideAccess: false,
        req,
        user: req.user,
      })
    : null

  const slug = (branch as { slug?: string } | null)?.slug

  const changes = slug
    ? await payload.find({
        collection: branchChangesCollectionSlug,
        depth: 0,
        overrideAccess: false,
        pagination: false,
        req,
        sort: 'collectionSlug',
        user: req.user,
        where: { branch: { equals: slug } },
      })
    : null

  const documentChanges: BranchChange[] = (changes?.docs ?? []).reduce<BranchChange[]>(
    (acc, change) => {
      const row = change as {
        collectionSlug?: string
        doc?: { value?: number | string } | number | string
        entityType?: string
        globalSlug?: string
        id: number | string
        operation?: BranchChange['operation']
      }

      // A global is listed alongside the documents rather than in a section of its own:
      // it is one more thing this branch changed, and merging works on the same rows.
      if (row.entityType === 'global' && row.globalSlug) {
        acc.push({
          id: String(row.id),
          globalSlug: row.globalSlug,
          operation: 'update',
        })

        return acc
      }

      const docID = typeof row.doc === 'object' ? row.doc?.value : row.doc

      if (row.collectionSlug && docID !== undefined && docID !== null && row.operation) {
        acc.push({
          id: String(row.id),
          collectionSlug: row.collectionSlug,
          docID,
          operation: row.operation,
        })
      }

      return acc
    },
    [],
  )

  // Upcoming schedules, soonest first. A branch can carry several — schedule a merge,
  // keep working, schedule another — so this is a list rather than a flag.
  const scheduledJobs = slug
    ? await payload.find({
        collection: 'payload-jobs',
        depth: 0,
        limit: 25,
        overrideAccess: false,
        pagination: false,
        req,
        sort: 'waitUntil',
        user: req.user,
        where: buildUpcomingMergeWhere({ branchSlug: slug }),
      })
    : null

  const scheduledMerges: ScheduledMerge[] = (scheduledJobs?.docs ?? []).reduce<ScheduledMerge[]>(
    (acc, job) => {
      const row = job as {
        id: number | string
        input?: { changes?: string[]; closeBranch?: boolean }
        waitUntil?: string
      }

      if (!row.waitUntil) {
        return acc
      }

      const selected = row.input?.changes?.length ? new Set(row.input.changes.map(String)) : null

      acc.push({
        id: String(row.id),
        // What a schedule will actually apply, resolved against what is pending *now*:
        // a schedule with no selection takes whatever is on the branch when it fires,
        // and a selection can name changes that have since been discarded.
        changes: selected
          ? documentChanges.filter((change) => selected.has(String(change.id)))
          : documentChanges,
        closeBranch: Boolean(row.input?.closeBranch),
        isEverything: !selected,
        waitUntil: row.waitUntil,
      })

      return acc
    },
    [],
  )

  // The merge history, newest first and paginated: a long-lived branch accumulates
  // one event per merge indefinitely, and each event carries a snapshot per document
  // it merged, so this is the one read on this page that grows without bound.
  const historyPage = Number(
    (props.searchParams as Record<string, string | undefined> | undefined)?.historyPage ?? 1,
  )
  const historyPageNumber = Number.isFinite(historyPage) && historyPage > 0 ? historyPage : 1

  const merges = slug
    ? await payload.find({
        collection: branchMergesCollectionSlug,
        depth: 0,
        limit: MERGE_HISTORY_PAGE_SIZE,
        overrideAccess: false,
        page: historyPageNumber,
        req,
        // `changes.before` / `changes.after` are whole-document snapshots, so they
        // are left out of the list read — a row's diff is fetched when it is opened.
        select: {
          branch: true,
          changes: {
            collectionSlug: true,
            docID: true,
            docTitle: true,
            globalSlug: true,
            operation: true,
          },
          mergedAt: true,
          mergedByLabel: true,
        },
        sort: '-mergedAt',
        user: req.user,
        where: { branch: { equals: slug } },
      })
    : null

  const mergeEvents: MergeEvent[] = (merges?.docs ?? []).map((event) => {
    const row = event as {
      changes?: {
        collectionSlug?: string
        docID?: string
        docTitle?: string
        globalSlug?: string
        operation?: string
      }[]
      id: number | string
      mergedAt?: string
      mergedByLabel?: string
    }

    return {
      id: String(row.id),
      changes: (row.changes ?? []).map((change) => ({
        collectionSlug: change.collectionSlug ?? '',
        docID: change.docID ?? '',
        docTitle: change.docTitle ?? change.docID ?? '',
        globalSlug: change.globalSlug,
        operation: (change.operation ?? 'update') as BranchChange['operation'],
      })),
      mergedAt: row.mergedAt ?? '',
      mergedByLabel: row.mergedByLabel,
    }
  })

  // Resolved here rather than passed through: the label is a function on this
  // collection, and `SetDocumentStepNav` is a client component.
  const pluralLabel =
    typeof collectionConfig?.labels?.plural === 'function'
      ? collectionConfig.labels.plural({ i18n, t: i18n.t })
      : collectionConfig?.labels?.plural

  return (
    <React.Fragment>
      {/* Without this the trail stops at the dashboard: the crumbs are set by the
          view, and this one replaced the default edit view. No crumb of its own —
          this is what a branch opens to, so naming it would repeat the branch. */}
      <SetDocumentStepNav
        collectionSlug={branchesCollectionSlug}
        id={branchID}
        pluralLabel={pluralLabel}
        useAsTitle={collectionConfig?.admin?.useAsTitle}
      />
      {branchID !== undefined && branchID !== null && (
        <BranchChanges
          branchID={branchID}
          branchName={(branch as { name?: string } | null)?.name ?? slug ?? ''}
          branchSlug={slug ?? ''}
          changes={documentChanges}
          historyPage={historyPageNumber}
          historyTotalPages={merges?.totalPages ?? 1}
          isClosed={(branch as { status?: string } | null)?.status === 'closed'}
          mergeEvents={mergeEvents}
          scheduledMerges={scheduledMerges}
        />
      )}
    </React.Fragment>
  )
}
