'use client'

import React, { useId, useRef, useState } from 'react'

import type { Labels } from './types.js'
import type { ActivityDocumentsPage, ActivityDocumentType } from './utils/getActivityWidgetDocs.js'

import { Button } from '../../elements/Button/index.js'
import { WidgetCard } from '../WidgetCard/index.js'
import { Pagination } from './components/Pagination/index.js'
import { PinnedDocuments } from './Tabs/PinnedDocuments/index.js'
import { usePinnedDocuments } from './Tabs/PinnedDocuments/usePinnedDocuments.js'
import { RecentDocuments } from './Tabs/RecentDocuments/index.js'
import { DOCUMENTS_BATCH_SIZE } from './utils/constants.js'
import { useActivityDocuments } from './utils/useActivityDocuments.js'
import { usePageSize } from './utils/usePageSize.js'
import './index.css'

type View = {
  /** Index of a document on the current page. Pages are derived from it for the current page size. */
  offset: number
  tab: ActivityDocumentType
}

/**
 * @internal - may change or be removed without a major version bump
 */
export function ActivityWidgetClient({
  excludedCollections,
  initialPages,
  labels,
  pinnableCollections,
  pinsURL,
}: {
  excludedCollections?: string[]
  initialPages?: Partial<Record<ActivityDocumentType, ActivityDocumentsPage>>
  labels: Labels
  pinnableCollections: string[]
  pinsURL: string
}) {
  const listID = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const pinnedTabRef = useRef<HTMLButtonElement>(null)
  const recentsTabRef = useRef<HTMLButtonElement>(null)
  const paginationFocusRef = useRef(false)
  const [view, setView] = useState<View>(() => ({
    offset: 0,
    tab: initialPages?.pinned?.totalDocs ? 'pinned' : 'recents',
  }))
  const [previousInitialPages, setPreviousInitialPages] = useState(initialPages)
  const pageSize = usePageSize({ paginationFocusRef, viewportRef })
  // Until the CSS page size is read, render a full batch and let the CSS tiers hide the overflow.
  const windowSize = pageSize ?? DOCUMENTS_BATCH_SIZE
  const canAddPin = pinnableCollections.length > 0

  if (previousInitialPages !== initialPages) {
    setPreviousInitialPages(initialPages)
    setView({ offset: 0, tab: view.tab })
  }

  const focusPinnedTab = () => pinnedTabRef.current?.focus()
  const focusActiveTab = () =>
    (view.tab === 'pinned' ? pinnedTabRef : recentsTabRef).current?.focus()
  const pinned = usePinnedDocuments({
    canAddPin,
    initialPage: initialPages?.pinned,
    isActive: view.tab === 'pinned',
    offset: view.tab === 'pinned' ? view.offset : 0,
    onFocusTab: focusPinnedTab,
    onPinAdded: () => setView({ offset: 0, tab: 'pinned' }),
    pageSize: windowSize,
    pinsURL,
  })
  const recents = useActivityDocuments({
    type: 'recents',
    excludedCollections,
    initialPage: initialPages?.recents,
    isActive: view.tab === 'recents',
    offset: view.tab === 'recents' ? view.offset : 0,
    pageSize: windowSize,
  })
  const documents = view.tab === 'pinned' ? pinned : recents
  const hasPinPlaceholder = view.tab === 'pinned' && canAddPin
  const loadError = documents.hasLoadError ? labels.loadError : ''
  const saveError = view.tab === 'pinned' && pinned.hasSaveError ? labels.pinnedSaveError : ''

  const selectTab = ({ tab }: { tab: ActivityDocumentType }) => {
    if (pinned.isSaving) {
      return
    }
    paginationFocusRef.current = false
    if (view.tab === tab && documents.currentPage === 1) {
      if (documents.hasLoadError) {
        documents.retry()
      }
      return
    }
    setView({ offset: 0, tab })
  }

  return (
    <WidgetCard className="activity-widget" title={labels.title}>
      <div className="activity-widget__toolbar">
        <div aria-label={labels.title} className="activity-widget__tabs" role="group">
          {(['pinned', 'recents'] as const).map((tab) => (
            <button
              aria-pressed={view.tab === tab}
              className="activity-widget__tab"
              key={tab}
              onClick={() => selectTab({ tab })}
              ref={tab === 'pinned' ? pinnedTabRef : recentsTabRef}
              type="button"
            >
              {tab === 'recents' ? labels.recents : labels.pinned}
            </button>
          ))}
        </div>
        <Pagination
          consumeFocusRequest={() => {
            const shouldRestoreFocus = paginationFocusRef.current

            paginationFocusRef.current = false
            return shouldRestoreFocus
          }}
          hasPinPlaceholder={hasPinPlaceholder}
          isDisabled={documents.isBusy || pinned.isSaving}
          labels={labels}
          listID={listID}
          offset={documents.start}
          onFocusTab={focusActiveTab}
          onPageChange={({ offset }) => {
            paginationFocusRef.current = true
            setView({ offset, tab: view.tab })
          }}
          pageSize={pageSize}
          totalDocs={documents.totalDocs}
        />
      </div>
      <div
        aria-busy={documents.isBusy}
        className="activity-widget__viewport"
        data-item-count={documents.totalDocs + Number(hasPinPlaceholder)}
        ref={viewportRef}
      >
        {loadError ? (
          <div className="activity-widget__error">
            <span>{loadError}</span>
            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={() => {
                focusActiveTab()
                documents.retry()
              }}
              size="medium"
              type="button"
            >
              {labels.retry}
            </Button>
          </div>
        ) : view.tab === 'pinned' ? (
          <PinnedDocuments
            canAddPin={canAddPin}
            documents={pinned}
            labels={labels}
            listID={listID}
            pinnableCollections={pinnableCollections}
            pinsURL={pinsURL}
          />
        ) : (
          <RecentDocuments documents={recents} labels={labels} listID={listID} />
        )}
        {saveError && !loadError ? (
          <span aria-hidden="true" className="activity-widget__save-error">
            {saveError}
          </span>
        ) : null}
        <span aria-hidden="true" className="activity-widget__loading">
          {documents.shouldShowLoading ? <span>{labels.loading}</span> : null}
        </span>
      </div>
      <span aria-live="polite" className="activity-widget__status sr-only">
        {saveError || loadError || (documents.shouldShowLoading ? labels.loading : '')}
      </span>
    </WidgetCard>
  )
}
