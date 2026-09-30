'use client'

import { PREFERENCE_KEYS } from 'payload/shared'
import React, { useRef, useState } from 'react'

import type { PinnedItem, PinnedPreferences } from './recents.js'

import { usePreferences } from '../../providers/Preferences/index.js'
import { WidgetCard } from '../WidgetCard/index.js'
import { documentKey, togglePinnedItem } from './recents.js'
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
  collection: string
  drafts: string
  draftsEmpty: string
  draftsEmptyDescription: string
  grid: string
  list: string
  name: string
  pinned: string
  pinnedEmpty: string
  pinnedEmptyDescription: string
  pinnedSaveError: string
  recents: string
  recentsEmpty: string
  recentsEmptyDescription: string
  removePin: string
  title: string
  updated: string
  updatedBy: string
}

type Tab = 'drafts' | 'pinned' | 'recents'
type View = 'grid' | 'list'

export function RecentsAndPinnedClient({
  drafts,
  labels,
  pinned: initialPinned,
  recents,
}: {
  drafts: RecentDocument[]
  labels: Labels
  pinned: RecentDocument[]
  recents: RecentDocument[]
}) {
  const { setPreference } = usePreferences()
  const pinnedTabRef = useRef<HTMLButtonElement>(null)
  const [activeTab, setActiveTab] = useState<Tab>('pinned')
  const [view, setView] = useState<View>('grid')
  const [pinned, setPinned] = useState(initialPinned)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const allDocuments = [...recents, ...drafts, ...pinned]
  const items = activeTab === 'recents' ? recents : activeTab === 'drafts' ? drafts : pinned
  const emptyMessage =
    activeTab === 'recents'
      ? labels.recentsEmpty
      : activeTab === 'drafts'
        ? labels.draftsEmpty
        : labels.pinnedEmpty
  const emptyDescription =
    activeTab === 'recents'
      ? labels.recentsEmptyDescription
      : activeTab === 'drafts'
        ? labels.draftsEmptyDescription
        : labels.pinnedEmptyDescription

  const togglePin = async (item: RecentDocument) => {
    if (isSaving) {
      return
    }

    const previous = pinned
    const wasPinned = pinned.some((entry) => documentKey(entry) === documentKey(item))
    const nextReferences = togglePinnedItem({ existing: pinned, item })
    const next = nextReferences
      .map((reference) => allDocuments.find((doc) => documentKey(doc) === documentKey(reference)))
      .filter((doc): doc is RecentDocument => Boolean(doc))

    setPinned(next)
    if (activeTab === 'pinned' && wasPinned) {
      requestAnimationFrame(() => pinnedTabRef.current?.focus())
    }
    setIsSaving(true)
    setSaveError('')

    try {
      await setPreference<PinnedPreferences>(PREFERENCE_KEYS.PINNED, { items: nextReferences })
    } catch {
      setPinned(previous)
      setSaveError(labels.pinnedSaveError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <WidgetCard className="recently-viewed-widget recents-widget" title={labels.title}>
      <div className="recents-widget__toolbar">
        <div aria-label={labels.title} className="recents-widget__tabs" role="group">
          {(['pinned', 'recents', 'drafts'] as const).map((tab) => (
            <button
              aria-pressed={activeTab === tab}
              className="recents-widget__tab"
              key={tab}
              onClick={() => setActiveTab(tab)}
              ref={tab === 'pinned' ? pinnedTabRef : undefined}
              type="button"
            >
              {tab === 'recents'
                ? labels.recents
                : tab === 'drafts'
                  ? labels.drafts
                  : labels.pinned}
            </button>
          ))}
        </div>
        <div aria-label={labels.title} className="recents-widget__views" role="group">
          <button
            aria-label={labels.grid}
            aria-pressed={view === 'grid'}
            className="recents-widget__view"
            onClick={() => setView('grid')}
            type="button"
          >
            <span
              aria-hidden="true"
              className="recents-widget__view-icon recents-widget__view-icon--grid"
            />
          </button>
          <button
            aria-label={labels.list}
            aria-pressed={view === 'list'}
            className="recents-widget__view"
            onClick={() => setView('list')}
            type="button"
          >
            <span
              aria-hidden="true"
              className="recents-widget__view-icon recents-widget__view-icon--table"
            />
          </button>
        </div>
      </div>
      {items.length ? (
        <div className={`recents-widget__content recents-widget__content--${view}`}>
          {view === 'list' ? (
            <div aria-hidden="true" className="recents-widget__list-header">
              <span>{labels.name}</span>
              <span>{labels.collection}</span>
              <span>{labels.updated} ↓</span>
              <span>{labels.updatedBy}</span>
            </div>
          ) : null}
          <ul className={`recents-widget__items recents-widget__items--${view}`}>
            {items.map((item) => {
              const isPinned = pinned.some((entry) => documentKey(entry) === documentKey(item))

              return (
                <li className="recents-widget__item" key={documentKey(item)}>
                  <a className="recents-widget__link" href={item.href}>
                    <span className="recents-widget__thumbnail-container">
                      {item.thumbnailURL ? (
                        <img alt="" className="recents-widget__thumbnail" src={item.thumbnailURL} />
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
                        {item.thumbnailURL ? (
                          <img
                            alt=""
                            className="recents-widget__list-thumbnail"
                            src={item.thumbnailURL}
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="recents-widget__list-thumbnail recents-widget__thumbnail--empty"
                          />
                        )}
                        <span className="recents-widget__name">{item.title}</span>
                        {item.statusLabel ? (
                          <span
                            className={`recents-widget__list-status${item.isDraft ? ' recents-widget__list-status--draft' : ''}`}
                          >
                            {item.statusLabel}
                          </span>
                        ) : null}
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
                    <span className="recents-widget__list-collection">{item.typeLabel}</span>
                    <span className="recents-widget__list-updated">
                      {item.dateTime && item.dateLabel ? (
                        <time dateTime={item.dateTime}>{item.dateLabel}</time>
                      ) : (
                        '—'
                      )}
                    </span>
                    <span className="recents-widget__list-updated-by">—</span>
                  </a>
                  {view === 'grid' ? (
                    <button
                      aria-label={`${isPinned ? labels.removePin : labels.addPin}: ${item.title}`}
                      aria-pressed={isPinned}
                      className="recents-widget__pin"
                      disabled={isSaving}
                      onClick={() => void togglePin(item)}
                      type="button"
                    >
                      <span aria-hidden="true" className="recents-widget__pin-icon" />
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
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
      <span aria-live="polite" className="recents-widget__status">
        {saveError}
      </span>
    </WidgetCard>
  )
}
