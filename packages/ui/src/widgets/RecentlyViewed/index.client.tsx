'use client'

import React, { useEffect, useId, useRef, useState } from 'react'

import type { DocumentsPage, DocumentsTab } from './getDocuments.js'
import type { PinnedItem } from './recents.js'

import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { WidgetCard } from '../WidgetCard/index.js'
import { documentKey } from './recents.js'
import './index.css'

export type RecentDocument = {
  dateLabel?: string
  dateTime?: string
  href: string
  isDraft?: boolean
  pinID?: number | string
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
  of: string
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
  const { serverFunction } = useServerFunctions()
  const contentRef = useRef<HTMLDivElement>(null)
  const listID = useId()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(0)
  const pinnedTabRef = useRef<HTMLButtonElement>(null)
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
  const totalPages = Math.max(1, Math.ceil(pageResult.totalDocs / (pageSize || 1)))
  const currentPage = pageResult.page
  const items = pageResult.items

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
          const lastPage = Math.max(1, Math.ceil(result.totalDocs / pageSize))
          requestAnimationFrame(() => {
            if (result.page === 1 && lastPage > 1) {
              nextPageRef.current?.focus()
            } else if (result.page === lastPage && lastPage > 1) {
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
  }, [activeTab, excludedCollections, labels.loadError, page, pageSize, refresh, serverFunction])

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

  const togglePin = async (item: RecentDocument) => {
    if (isSaving) {
      return
    }

    const previous = pageResult
    const wasPinned = item.pinID !== undefined
    setPageResult((current) => ({
      ...current,
      items:
        activeTab === 'pinned' && wasPinned
          ? current.items.filter((entry) => documentKey(entry) !== documentKey(item))
          : current.items.map((entry) =>
              documentKey(entry) === documentKey(item)
                ? { ...entry, pinID: wasPinned ? undefined : 'pending' }
                : entry,
            ),
    }))
    if (activeTab === 'pinned' && wasPinned) {
      requestAnimationFrame(() => pinnedTabRef.current?.focus())
    }
    setIsSaving(true)
    setSaveError('')

    try {
      const response = await fetch(
        wasPinned ? `${pinsURL}/${encodeURIComponent(String(item.pinID))}` : pinsURL,
        {
          credentials: 'include',
          method: wasPinned ? 'DELETE' : 'POST',
          ...(wasPinned
            ? {}
            : {
                body: JSON.stringify({
                  document: { relationTo: item.collectionSlug, value: item.id },
                }),
                headers: { 'Content-Type': 'application/json' },
              }),
        },
      )

      if (!response.ok) {
        throw new Error('Unable to save pin')
      }

      setRefresh((value) => value + 1)
    } catch {
      setPageResult(previous)
      setSaveError(labels.pinnedSaveError)
    } finally {
      setIsSaving(false)
    }
  }

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
              ref={tab === 'pinned' ? pinnedTabRef : undefined}
              type="button"
            >
              {tab === 'recents' ? labels.recents : labels.pinned}
            </button>
          ))}
        </div>
      </div>
      <div aria-busy={isLoading} ref={contentRef}>
        {items.length ? (
          <div className="recents-widget__content">
            <ul className="recents-widget__items recents-widget__items--grid" id={listID}>
              {items.map((item) => {
                const isPinned = item.pinID !== undefined

                return (
                  <li className="recents-widget__item" key={documentKey(item)}>
                    <a className="recents-widget__link" href={item.href}>
                      <span className="recents-widget__thumbnail-container">
                        {item.thumbnailURL ? (
                          <img
                            alt=""
                            className="recents-widget__thumbnail"
                            src={item.thumbnailURL}
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="recents-widget__thumbnail recents-widget__thumbnail--empty"
                          />
                        )}
                        {item.statusLabel ? (
                          <span
                            className={`recents-widget__status-pill${item.isDraft ? ' recents-widget__status-pill--draft' : ''}`}
                          >
                            {item.statusLabel}
                          </span>
                        ) : null}
                      </span>
                      <span className="recents-widget__details">
                        <span className="recents-widget__name-row">
                          <span className="recents-widget__name">{item.title}</span>
                        </span>
                        <span className="recents-widget__meta">
                          {item.typeLabel}
                          {item.dateTime && item.dateLabel ? (
                            <>
                              {' · '}
                              <time dateTime={item.dateTime}>{item.dateLabel}</time>
                            </>
                          ) : null}
                        </span>
                      </span>
                    </a>
                    <button
                      aria-label={`${isPinned ? labels.removePin : labels.addPin}: ${item.title}`}
                      aria-pressed={isPinned}
                      className="recents-widget__pin"
                      disabled={isSaving || isLoading}
                      onClick={() => void togglePin(item)}
                      type="button"
                    >
                      <span aria-hidden="true" className="recents-widget__pin-icon" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : isLoading ? (
          <div className="recents-widget__empty" />
        ) : loadError ? null : (
          <div aria-live="polite" className="recents-widget__empty">
            <span
              aria-hidden="true"
              className={`recents-widget__empty-icon recents-widget__empty-icon--${activeTab}`}
            />
            <span className="recents-widget__empty-text">
              <span className="recents-widget__empty-title">{emptyMessage}</span>
              <span className="recents-widget__empty-description">{emptyDescription}</span>
            </span>
          </div>
        )}
      </div>
      {pageResult.totalDocs > 0 ? (
        <div aria-label={labels.title} className="recents-widget__pagination" role="group">
          <button
            aria-controls={listID}
            aria-disabled={isLoading || isSaving}
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
            {labels.previous}
          </button>
          <span aria-atomic="true" aria-live="polite">
            {currentPage} {labels.of} {totalPages}
          </span>
          <button
            aria-controls={listID}
            aria-disabled={isLoading || isSaving}
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
            {labels.next}
          </button>
        </div>
      ) : null}
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
