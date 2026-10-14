'use client'

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import type { DocumentsPage, DocumentsTab } from './getDocuments.js'
import type { PinnedItem } from './recents.js'

import { Button } from '../../elements/Button/index.js'
import { CardGrid } from '../../elements/CardGrid/index.js'
import { DocumentCard } from '../../elements/DocumentCard/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { ClockIcon } from '../../icons/Clock/index.js'
import { DocumentIcon } from '../../icons/Document/index.js'
import { PinIcon } from '../../icons/Pin/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { WidgetCard } from '../WidgetCard/index.js'
import { PinDocumentPicker } from './PinDocumentPicker/index.js'
import { updatePinnedPreferences } from './pinnedPreferences.js'
import { documentKey, DOCUMENTS_BATCH_SIZE, PAGE_SIZES } from './recents.js'
import './index.css'

export type RecentDocument = {
  dateLabel?: string
  dateTime?: string
  href: string
  isChanged?: boolean
  isDraft?: boolean
  statusLabel?: string
  thumbnailURL?: string
  title: string
  typeLabel: string
  updatedAt?: string
  viewedAt?: string
} & PinnedItem

type Labels = {
  addPin: string
  loadError: string
  loading: string
  next: string
  pagination: string
  pinned: string
  pinnedEmpty: string
  pinnedEmptyDescription: string
  pinnedSaveError: string
  previous: string
  recents: string
  recentsEmpty: string
  recentsEmptyDescription: string
  removePin: string
  retry: string
  title: string
}

/** Loaded documents of one tab, keyed by batch index. */
type TabDocuments = {
  batches: Record<number, RecentDocument[]>
  totalDocs: number
}

type DocumentsByTab = Partial<Record<DocumentsTab, TabDocuments>>

type View = {
  /** Index of a document on the current page. Pages are derived from it for the current page size. */
  offset: number
  tab: DocumentsTab
}

export function RecentsAndPinnedClient({
  excludedCollections,
  initialPages,
  labels,
  pinnableCollections,
  pinsURL,
}: {
  excludedCollections?: string[]
  initialPages?: Partial<Record<DocumentsTab, DocumentsPage>>
  labels: Labels
  pinnableCollections: string[]
  pinsURL: string
}) {
  const { t } = useTranslation()
  const { serverFunction } = useServerFunctions()
  const canAddPin = pinnableCollections.length > 0
  const viewportRef = useRef<HTMLDivElement>(null)
  const listID = useId()
  const pinnedTabRef = useRef<HTMLButtonElement>(null)
  const recentsTabRef = useRef<HTMLButtonElement>(null)
  const previousPageRef = useRef<HTMLButtonElement>(null)
  const nextPageRef = useRef<HTMLButtonElement>(null)
  const requestIDRef = useRef(0)
  const [pageSize, setPageSize] = useState<null | number>(null)
  const [view, setView] = useState<View>({ offset: 0, tab: 'pinned' })
  const [documentsByTab, setDocumentsByTab] = useState<DocumentsByTab>(() =>
    getInitialDocuments({ initialPages }),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [shouldShowLoading, setShouldShowLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')
  const activeTab = view.tab
  const tabDocuments = documentsByTab[activeTab]
  const totalDocs = tabDocuments?.totalDocs ?? 0
  const hasPinPlaceholder = activeTab === 'pinned' && canAddPin
  // Until the CSS page size is read, render a full batch and let the CSS tiers hide the overflow.
  const windowSize = pageSize ?? DOCUMENTS_BATCH_SIZE
  const { currentPage, start } = getPage({
    hasPinPlaceholder,
    offset: view.offset,
    pageSize: windowSize,
    totalDocs,
  })
  const items = getWindowItems({ documents: tabDocuments, size: windowSize, start })
  const missingBatchCount = getMissingBatches({
    documents: tabDocuments,
    size: windowSize,
    start,
  }).length
  const hasAddPinCard = hasPinPlaceholder && items !== undefined && start + windowSize > totalDocs
  const isBusy = isLoading || items === undefined

  useLayoutEffect(() => {
    const element = viewportRef.current

    if (!element) {
      return
    }

    const readPageSize = () => {
      const value = Number(getComputedStyle(element).getPropertyValue('--recents-page-size'))

      if (value > 0) {
        setPageSize(value)
      }
    }

    readPageSize()
    const observer = new ResizeObserver(readPageSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  /**
   * Shows `nextView` once its documents are loaded. Page changes keep the current page visible
   * while loading, tab changes switch immediately. Resolves with the tab's documents, or
   * `undefined` when the load failed or was superseded.
   */
  const showView = async ({
    isReplacing = false,
    nextView,
  }: {
    isReplacing?: boolean
    nextView: View
  }): Promise<TabDocuments | undefined> => {
    const known = documentsByTab[nextView.tab]
    const { start: nextStart } = getPage({
      hasPinPlaceholder: nextView.tab === 'pinned' && canAddPin,
      offset: nextView.offset,
      pageSize: windowSize,
      totalDocs: known?.totalDocs ?? 0,
    })
    const missingBatches = getMissingBatches({
      documents: isReplacing && known ? { ...known, batches: {} } : known,
      size: windowSize,
      start: nextStart,
    })
    const requestID = ++requestIDRef.current

    setLoadError('')

    if (!missingBatches.length && known) {
      setIsLoading(false)
      setView(nextView)

      return known
    }

    if (nextView.tab !== activeTab) {
      setView(nextView)
    }
    setIsLoading(true)
    setShouldShowLoading(false)
    const loadingTimeout = setTimeout(() => setShouldShowLoading(true), 180)

    try {
      const results = await Promise.all(
        missingBatches.map(
          (batch) =>
            serverFunction({
              name: 'get-dashboard-documents',
              args: {
                excludedCollections,
                limit: DOCUMENTS_BATCH_SIZE,
                page: batch + 1,
                tab: nextView.tab,
              },
            }) as Promise<DocumentsPage>,
        ),
      )

      if (requestID !== requestIDRef.current) {
        return undefined
      }

      const totalDocs = results[results.length - 1].totalDocs
      // Cached batches are only valid for the total they were loaded with.
      const batches =
        isReplacing || !known || known.totalDocs !== totalDocs ? {} : { ...known.batches }

      for (const result of results) {
        // The server clamps out-of-range pages to the last one and reports the page it returned.
        batches[result.page - 1] = result.items
      }
      const documents: TabDocuments = { batches, totalDocs }

      setDocumentsByTab((current) => ({ ...current, [nextView.tab]: documents }))
      setView(nextView)
      setIsLoading(false)

      return documents
    } catch {
      if (requestID === requestIDRef.current) {
        setView(nextView)
        setIsLoading(false)
        setLoadError(labels.loadError)
      }

      return undefined
    } finally {
      clearTimeout(loadingTimeout)
    }
  }

  const loadMissingBatches = useEffectEvent(() => {
    void showView({ nextView: view })
  })

  useEffect(() => {
    if (missingBatchCount > 0 && !isLoading && !loadError) {
      loadMissingBatches()
    }
  }, [isLoading, loadError, missingBatchCount])

  const excludedCollectionsKey = JSON.stringify(excludedCollections ?? [])
  const previousExcludedCollectionsKeyRef = useRef(excludedCollectionsKey)

  useEffect(() => {
    if (previousExcludedCollectionsKeyRef.current === excludedCollectionsKey) {
      return
    }
    previousExcludedCollectionsKeyRef.current = excludedCollectionsKey
    // Exclusions only apply to recents, which reloads through the missing-batch effect.
    setDocumentsByTab((current) => ({ pinned: current.pinned }))
    setView((current) => (current.tab === 'recents' ? { ...current, offset: 0 } : current))
  }, [excludedCollectionsKey])

  const goToPage = async ({ page }: { page: number }) => {
    if (isLoading || isSaving) {
      return
    }

    const documents = await showView({
      nextView: { offset: (page - 1) * windowSize, tab: activeTab },
    })

    if (!documents) {
      return
    }

    const { currentPage: shownPage, totalPages: lastPage } = getPage({
      hasPinPlaceholder,
      offset: (page - 1) * windowSize,
      pageSize: windowSize,
      totalDocs: documents.totalDocs,
    })

    requestAnimationFrame(() => {
      if (lastPage === 1) {
        const activeTabRef = activeTab === 'pinned' ? pinnedTabRef : recentsTabRef

        activeTabRef.current?.focus()
      } else if (shownPage === 1) {
        nextPageRef.current?.focus()
      } else if (shownPage === lastPage) {
        previousPageRef.current?.focus()
      }
    })
  }

  const emptyMessage = activeTab === 'recents' ? labels.recentsEmpty : labels.pinnedEmpty
  const emptyDescription =
    activeTab === 'recents' ? labels.recentsEmptyDescription : labels.pinnedEmptyDescription

  const removePinnedDocument = async ({ item }: { item: RecentDocument }) => {
    if (isSaving || activeTab !== 'pinned') {
      return
    }

    const previous = documentsByTab.pinned

    setDocumentsByTab((current) => ({
      ...current,
      pinned: current.pinned && removeDocument({ documents: current.pinned, item }),
    }))
    requestAnimationFrame(() => pinnedTabRef.current?.focus())
    setIsSaving(true)
    setSaveError('')

    try {
      await updatePinnedPreferences({ document: item, shouldPin: false, url: pinsURL })
      void showView({ isReplacing: true, nextView: view })
    } catch {
      setDocumentsByTab((current) => ({ ...current, pinned: previous }))
      setSaveError(labels.pinnedSaveError)
    } finally {
      setIsSaving(false)
    }
  }

  const addSelectedPin = async ({ document }: { document: PinnedItem }) => {
    if (isSaving) {
      return
    }
    setIsSaving(true)
    setSaveError('')

    try {
      await updatePinnedPreferences({ document, shouldPin: true, url: pinsURL })
      void showView({ isReplacing: true, nextView: { offset: 0, tab: 'pinned' } })
    } catch {
      setSaveError(labels.pinnedSaveError)
    } finally {
      setIsSaving(false)
      requestAnimationFrame(() => pinnedTabRef.current?.focus())
    }
  }

  const pinDocumentPicker = canAddPin ? (
    <PinDocumentPicker
      collectionSlugs={pinnableCollections}
      isDisabled={isBusy || isSaving}
      isEmpty={totalDocs === 0}
      labels={labels}
      onError={() => setSaveError(labels.pinnedSaveError)}
      onSelect={(args) => void addSelectedPin(args)}
      pinsURL={pinsURL}
    />
  ) : null

  // Before the CSS page size is known, render one pagination per page size and let CSS pick one.
  const paginationSizes: readonly number[] = pageSize ? [pageSize] : PAGE_SIZES

  return (
    <WidgetCard className="recently-viewed-widget recents-widget" title={labels.title}>
      <div className="recents-widget__toolbar">
        <div aria-label={labels.title} className="recents-widget__tabs" role="group">
          {(['pinned', 'recents'] as const).map((tab) => (
            <button
              aria-pressed={activeTab === tab}
              className="recents-widget__tab"
              key={tab}
              onClick={() => {
                if (isSaving) {
                  return
                }
                if (activeTab === tab && currentPage === 1) {
                  if (loadError) {
                    void showView({ nextView: view })
                  }
                  return
                }
                void showView({ nextView: { offset: 0, tab } })
              }}
              ref={tab === 'pinned' ? pinnedTabRef : recentsTabRef}
              type="button"
            >
              {tab === 'recents' ? labels.recents : labels.pinned}
            </button>
          ))}
        </div>
        {paginationSizes.map((size) => {
          const page = getPage({
            hasPinPlaceholder,
            offset: view.offset,
            pageSize: size,
            totalDocs,
          })

          if (page.totalPages <= 1) {
            return null
          }

          return (
            <div
              aria-label={labels.pagination}
              className="recents-widget__pagination"
              data-page-size={pageSize ? undefined : size}
              key={size}
              role="group"
            >
              <button
                aria-controls={listID}
                aria-disabled={isBusy || isSaving}
                aria-label={labels.previous}
                className="recents-widget__previous"
                disabled={page.currentPage === 1}
                onClick={() => void goToPage({ page: page.currentPage - 1 })}
                ref={previousPageRef}
                type="button"
              >
                <span aria-hidden="true">
                  <ChevronIcon direction="left" />
                </span>
              </button>
              <span aria-atomic="true" aria-live="polite" className="recents-widget__page-status">
                {t('dashboard:widgetPageCount', {
                  currentPage: page.currentPage,
                  totalPages: page.totalPages,
                })}
              </span>
              <button
                aria-controls={listID}
                aria-disabled={isBusy || isSaving}
                aria-label={labels.next}
                className="recents-widget__next"
                disabled={page.currentPage === page.totalPages}
                onClick={() => void goToPage({ page: page.currentPage + 1 })}
                ref={nextPageRef}
                type="button"
              >
                <span aria-hidden="true">
                  <ChevronIcon direction="right" />
                </span>
              </button>
            </div>
          )
        })}
      </div>
      <div
        aria-busy={isBusy}
        className="recents-widget__viewport"
        data-item-count={totalDocs + Number(hasPinPlaceholder)}
        ref={viewportRef}
      >
        {loadError ? (
          <div className="recents-widget__error">
            <span>{loadError}</span>
            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={() => {
                const activeTabRef = activeTab === 'pinned' ? pinnedTabRef : recentsTabRef

                activeTabRef.current?.focus()
                void showView({ nextView: view })
              }}
              size="medium"
              type="button"
            >
              {labels.retry}
            </Button>
          </div>
        ) : items === undefined ? null : items.length || hasAddPinCard ? (
          <div className="recents-widget__content" id={listID}>
            <CardGrid<null | RecentDocument>
              ariaLabel={activeTab === 'pinned' ? labels.pinned : labels.recents}
              className="recents-widget__items recents-widget__items--grid"
              getItemClassName={(item) =>
                item
                  ? 'recents-widget__item'
                  : `recents-widget__item recents-widget__item--add-pin${totalDocs === 0 ? ' recents-widget__item--empty' : ''}`
              }
              getKey={(item) => (item ? documentKey(item) : 'add-pin')}
              items={hasAddPinCard ? [...items, null] : items}
              renderItem={(item) =>
                item ? (
                  <DocumentCard
                    href={item.href}
                    placeholder={<DocumentIcon />}
                    thumbnail={
                      item.thumbnailURL
                        ? {
                            alt: '',
                            // Cards past the smallest page size are hidden by CSS in narrow tiers.
                            loading: items.indexOf(item) < PAGE_SIZES[0] ? 'eager' : 'lazy',
                            src: item.thumbnailURL,
                          }
                        : undefined
                    }
                    title={item.title}
                  >
                    <div className="recents-widget__meta">
                      {item.typeLabel}
                      {item.dateTime && item.dateLabel ? (
                        <>
                          {' · '}
                          <time dateTime={item.dateTime}>{item.dateLabel}</time>
                        </>
                      ) : null}
                    </div>
                    {item.statusLabel ? (
                      <span
                        className={`recents-widget__status-pill${item.isDraft ? ' recents-widget__status-pill--draft' : item.isChanged ? ' recents-widget__status-pill--changed' : ''}`}
                      >
                        {item.statusLabel}
                      </span>
                    ) : null}
                    {activeTab === 'pinned' ? (
                      <button
                        aria-label={`${labels.removePin}: ${item.title}`}
                        aria-pressed={true}
                        className="recents-widget__pin"
                        disabled={isSaving || isBusy}
                        onClick={() => void removePinnedDocument({ item })}
                        type="button"
                      >
                        <span aria-hidden="true" className="recents-widget__pin-icon">
                          <PinIcon isFilled />
                        </span>
                      </button>
                    ) : null}
                  </DocumentCard>
                ) : (
                  pinDocumentPicker
                )
              }
            />
          </div>
        ) : (
          <div aria-live="polite" className="recents-widget__empty">
            <span
              aria-hidden="true"
              className={`recents-widget__empty-icon recents-widget__empty-icon--${activeTab}`}
            >
              {activeTab === 'pinned' ? <PinIcon /> : <ClockIcon />}
            </span>
            <span className="recents-widget__empty-text">
              <span className="recents-widget__empty-title">{emptyMessage}</span>
              <span className="recents-widget__empty-description">{emptyDescription}</span>
            </span>
          </div>
        )}
        {saveError && !loadError ? (
          <span aria-hidden="true" className="recents-widget__save-error">
            {saveError}
          </span>
        ) : null}
        <span aria-hidden="true" className="recents-widget__loading">
          {isLoading && shouldShowLoading ? <span>{labels.loading}</span> : null}
        </span>
      </div>
      <span aria-live="polite" className="recents-widget__status sr-only">
        {saveError || loadError || (isLoading && shouldShowLoading ? labels.loading : '')}
      </span>
    </WidgetCard>
  )
}

function getInitialDocuments({
  initialPages = {},
}: {
  initialPages?: Partial<Record<DocumentsTab, DocumentsPage>>
}): DocumentsByTab {
  return Object.fromEntries(
    Object.entries(initialPages)
      .filter(([, page]) => page)
      .map(([tab, page]) => [
        tab,
        { batches: { [page.page - 1]: page.items }, totalDocs: page.totalDocs },
      ]),
  )
}

/** Pages are aligned to the page size, so a page change after a resize keeps `offset` visible. */
function getPage({
  hasPinPlaceholder,
  offset,
  pageSize,
  totalDocs,
}: {
  hasPinPlaceholder: boolean
  offset: number
  pageSize: number
  totalDocs: number
}) {
  const totalPages = Math.max(1, Math.ceil((totalDocs + Number(hasPinPlaceholder)) / pageSize))
  const currentPage = Math.min(Math.floor(offset / pageSize) + 1, totalPages)

  return { currentPage, start: (currentPage - 1) * pageSize, totalPages }
}

function getMissingBatches({
  documents,
  size,
  start,
}: {
  documents: TabDocuments | undefined
  size: number
  start: number
}): number[] {
  const firstBatch = Math.floor(start / DOCUMENTS_BATCH_SIZE)
  const lastBatch = documents
    ? Math.min(
        Math.floor((start + size - 1) / DOCUMENTS_BATCH_SIZE),
        Math.max(0, Math.ceil(documents.totalDocs / DOCUMENTS_BATCH_SIZE) - 1),
      )
    : firstBatch
  const missingBatches: number[] = []

  for (let batch = firstBatch; batch <= lastBatch; batch++) {
    if (!documents?.batches[batch]) {
      missingBatches.push(batch)
    }
  }

  return missingBatches
}

/** Returns `undefined` until every batch the window touches has loaded. */
function getWindowItems({
  documents,
  size,
  start,
}: {
  documents: TabDocuments | undefined
  size: number
  start: number
}): RecentDocument[] | undefined {
  if (!documents || getMissingBatches({ documents, size, start }).length) {
    return undefined
  }

  const items: RecentDocument[] = []

  for (let index = start; index < Math.min(start + size, documents.totalDocs); index++) {
    const item =
      documents.batches[Math.floor(index / DOCUMENTS_BATCH_SIZE)]?.[index % DOCUMENTS_BATCH_SIZE]

    if (item) {
      items.push(item)
    }
  }

  return items
}

function removeDocument({
  documents,
  item,
}: {
  documents: TabDocuments
  item: RecentDocument
}): TabDocuments {
  const key = documentKey(item)

  return {
    batches: Object.fromEntries(
      Object.entries(documents.batches).map(([batch, batchItems]) => [
        batch,
        batchItems.filter((entry) => documentKey(entry) !== key),
      ]),
    ),
    totalDocs: Math.max(0, documents.totalDocs - 1),
  }
}
