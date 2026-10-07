'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { DocumentsPage, DocumentsTab } from './getDocuments.js'
import type { PinnedItem } from './recents.js'

import { CardGrid } from '../../elements/CardGrid/index.js'
import { DocumentCard } from '../../elements/DocumentCard/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { ClockIcon } from '../../icons/Clock/index.js'
import { DocumentIcon } from '../../icons/Document/index.js'
import { PinIcon } from '../../icons/Pin/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useEntityVisibility } from '../../providers/EntityVisibility/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { WidgetCard } from '../WidgetCard/index.js'
import { PinDocumentPicker } from './PinDocumentPicker/index.js'
import { updatePinnedPreferences } from './pinnedPreferences.js'
import { documentKey } from './recents.js'
import './index.css'

export type RecentDocument = {
  dateLabel?: string
  dateTime?: string
  href: string
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

export function RecentsAndPinnedClient({
  excludedCollections,
  labels,
  pinsURL,
}: {
  excludedCollections?: string[]
  labels: Labels
  pinsURL: string
}) {
  const { permissions, user } = useAuth()
  const { t } = useTranslation()
  const { config } = useConfig()
  const { isEntityVisible } = useEntityVisibility()
  const { serverFunction } = useServerFunctions()
  const pinnableCollections = useMemo(
    () =>
      config.collections
        .filter(
          ({ slug }) =>
            isEntityVisible({ collectionSlug: slug }) && permissions?.collections?.[slug]?.read,
        )
        .map(({ slug }) => slug),
    [config.collections, isEntityVisible, permissions],
  )
  const canAddPin = Boolean(user) && pinnableCollections.length > 0
  const contentRef = useRef<HTMLDivElement>(null)
  const listID = useId()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(0)
  const pinnedTabRef = useRef<HTMLButtonElement>(null)
  const recentsTabRef = useRef<HTMLButtonElement>(null)
  const previousPageRef = useRef<HTMLButtonElement>(null)
  const nextPageRef = useRef<HTMLButtonElement>(null)
  const paginationFocusRef = useRef(false)
  const [activeTab, setActiveTab] = useState<DocumentsTab>('pinned')
  const [pageResult, setPageResult] = useState<DocumentsPage>({ items: [], page: 1, totalDocs: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const shouldIncludePinPlaceholder = activeTab === 'pinned' && canAddPin
  const totalPages = Math.max(
    1,
    Math.ceil((pageResult.totalDocs + Number(shouldIncludePinPlaceholder)) / (pageSize || 1)),
  )
  const currentPage = pageResult.page
  const items = pageResult.items
  const hasAddPinCard =
    shouldIncludePinPlaceholder && pageResult.page === totalPages && items.length < pageSize

  useEffect(() => {
    if (!pageSize) {
      return
    }
    let isCurrent = true
    setIsLoading(true)
    setLoadError('')
    void (
      serverFunction({
        name: 'get-dashboard-documents',
        args: {
          excludedCollections,
          limit: pageSize,
          page,
          shouldIncludePinPlaceholder,
          tab: activeTab,
        },
      }) as Promise<DocumentsPage>
    )
      .then((result: DocumentsPage) => {
        if (!isCurrent) {
          return
        }
        setPageResult(result)
        setPage(result.page)
        setIsLoading(false)
        if (paginationFocusRef.current) {
          paginationFocusRef.current = false
          const lastPage = Math.max(
            1,
            Math.ceil((result.totalDocs + Number(shouldIncludePinPlaceholder)) / pageSize),
          )
          requestAnimationFrame(() => {
            if (lastPage === 1) {
              const activeTabRef = activeTab === 'pinned' ? pinnedTabRef : recentsTabRef

              activeTabRef.current?.focus()
            } else if (result.page === 1) {
              nextPageRef.current?.focus()
            } else if (result.page === lastPage) {
              previousPageRef.current?.focus()
            }
          })
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsLoading(false)
          paginationFocusRef.current = false
          setLoadError(labels.loadError)
        }
      })
    return () => {
      isCurrent = false
    }
  }, [
    activeTab,
    excludedCollections,
    shouldIncludePinPlaceholder,
    labels.loadError,
    page,
    pageSize,
    refresh,
    serverFunction,
  ])

  useEffect(() => {
    const element = contentRef.current

    if (!element) {
      return
    }

    let observedPageSize = 0
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      const nextPageSize = width >= 768 ? 4 : width >= 400 ? 2 : 1

      if (nextPageSize !== observedPageSize) {
        observedPageSize = nextPageSize
        setPageSize(nextPageSize)
        setPage(1)
      }
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const emptyMessage = activeTab === 'recents' ? labels.recentsEmpty : labels.pinnedEmpty
  const emptyDescription =
    activeTab === 'recents' ? labels.recentsEmptyDescription : labels.pinnedEmptyDescription

  const removePinnedDocument = async ({ item }: { item: RecentDocument }) => {
    if (isSaving || activeTab !== 'pinned') {
      return
    }

    const previous = pageResult

    setPageResult((current) => ({
      ...current,
      items: current.items.filter((entry) => documentKey(entry) !== documentKey(item)),
    }))
    requestAnimationFrame(() => pinnedTabRef.current?.focus())
    setIsSaving(true)
    setSaveError('')

    try {
      await updatePinnedPreferences({ document: item, shouldPin: false, url: pinsURL })
      setRefresh((value) => value + 1)
    } catch {
      setPageResult(previous)
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
      setPage(1)
      setRefresh((value) => value + 1)
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
      isDisabled={isLoading || isSaving}
      isEmpty={pageResult.totalDocs === 0}
      labels={labels}
      onError={() => setSaveError(labels.pinnedSaveError)}
      onSelect={(args) => void addSelectedPin(args)}
      pinsURL={pinsURL}
    />
  ) : null

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
                if (activeTab === tab && page === 1) {
                  if (loadError) {
                    setRefresh((value) => value + 1)
                  }
                  return
                }
                setPageResult({ items: [], page: 1, totalDocs: 0 })
                setIsLoading(true)
                setActiveTab(tab)
                setPage(1)
              }}
              ref={tab === 'pinned' ? pinnedTabRef : recentsTabRef}
              type="button"
            >
              {tab === 'recents' ? labels.recents : labels.pinned}
            </button>
          ))}
        </div>
        {totalPages > 1 ? (
          <div aria-label={labels.pagination} className="recents-widget__pagination" role="group">
            <button
              aria-controls={listID}
              aria-disabled={isLoading || isSaving}
              aria-label={labels.previous}
              className="recents-widget__previous"
              disabled={currentPage === 1}
              onClick={() => {
                if (isLoading || isSaving) {
                  return
                }
                paginationFocusRef.current = true
                setPage(currentPage - 1)
              }}
              ref={previousPageRef}
              type="button"
            >
              <span aria-hidden="true">
                <ChevronIcon direction="left" />
              </span>
            </button>
            <span aria-atomic="true" aria-live="polite" className="recents-widget__page-status">
              {t('dashboard:widgetPageCount', { currentPage, totalPages })}
            </span>
            <button
              aria-controls={listID}
              aria-disabled={isLoading || isSaving}
              aria-label={labels.next}
              className="recents-widget__next"
              disabled={currentPage === totalPages}
              onClick={() => {
                if (isLoading || isSaving) {
                  return
                }
                paginationFocusRef.current = true
                setPage(currentPage + 1)
              }}
              ref={nextPageRef}
              type="button"
            >
              <span aria-hidden="true">
                <ChevronIcon direction="right" />
              </span>
            </button>
          </div>
        ) : null}
      </div>
      <div aria-busy={isLoading} className="recents-widget__viewport" ref={contentRef}>
        {items.length || (hasAddPinCard && !isLoading && !loadError) ? (
          <div className="recents-widget__content" id={listID}>
            <CardGrid<null | RecentDocument>
              ariaLabel={activeTab === 'pinned' ? labels.pinned : labels.recents}
              className="recents-widget__items recents-widget__items--grid"
              getItemClassName={(item) =>
                item
                  ? 'recents-widget__item'
                  : `recents-widget__item recents-widget__item--add-pin${pageResult.totalDocs === 0 ? ' recents-widget__item--empty' : ''}`
              }
              getKey={(item) => (item ? documentKey(item) : 'add-pin')}
              items={hasAddPinCard ? [...items, null] : items}
              renderItem={(item) =>
                item ? (
                  <DocumentCard
                    href={item.href}
                    placeholder={<DocumentIcon />}
                    thumbnail={item.thumbnailURL ? { alt: '', src: item.thumbnailURL } : undefined}
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
                        className={`recents-widget__status-pill${item.isDraft ? ' recents-widget__status-pill--draft' : ''}`}
                      >
                        {item.statusLabel}
                      </span>
                    ) : null}
                    {activeTab === 'pinned' ? (
                      <button
                        aria-label={`${labels.removePin}: ${item.title}`}
                        aria-pressed={true}
                        className="recents-widget__pin"
                        disabled={isSaving || isLoading}
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
        ) : isLoading ? (
          <div className="recents-widget__empty" />
        ) : loadError ? null : (
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
      </div>
      <span aria-live="polite" className="recents-widget__status">
        {saveError || loadError || (isLoading ? labels.loading : '')}
      </span>
      {loadError ? (
        <button onClick={() => setRefresh((value) => value + 1)} type="button">
          {labels.retry}
        </button>
      ) : null}
    </WidgetCard>
  )
}
