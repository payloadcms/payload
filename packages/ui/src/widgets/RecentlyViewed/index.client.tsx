'use client'

import { PREFERENCE_KEYS } from 'payload/shared'
import React, { useRef, useState } from 'react'

import type { PinnedItem, PinnedPreferences } from './recents.js'

import { AlignJustifiedIcon } from '../../icons/AlignJustified/index.js'
import { GridViewIcon } from '../../icons/GridView/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { WidgetCard } from '../WidgetCard/index.js'
import { documentKey, togglePinnedItem } from './recents.js'
import './index.css'

export type RecentDocument = {
  dateLabel?: string
  dateTime?: string
  href: string
  thumbnailURL?: string
  title: string
  typeLabel: string
  updatedAt?: string
  viewedAt?: string
} & PinnedItem

type Labels = {
  addPin: string
  drafts: string
  draftsEmpty: string
  grid: string
  list: string
  pinned: string
  pinnedEmpty: string
  pinnedSaveError: string
  recents: string
  recentsEmpty: string
  removePin: string
  title: string
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
  const [activeTab, setActiveTab] = useState<Tab>('recents')
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
          {(['recents', 'drafts', 'pinned'] as const).map((tab) => (
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
            <GridViewIcon size={16} />
          </button>
          <button
            aria-label={labels.list}
            aria-pressed={view === 'list'}
            className="recents-widget__view"
            onClick={() => setView('list')}
            type="button"
          >
            <AlignJustifiedIcon size={16} />
          </button>
        </div>
      </div>
      {items.length ? (
        <ul className={`recents-widget__items recents-widget__items--${view}`}>
          {items.map((item) => {
            const isPinned = pinned.some((entry) => documentKey(entry) === documentKey(item))

            return (
              <li className="recents-widget__item" key={documentKey(item)}>
                <a className="recents-widget__link" href={item.href}>
                  {item.thumbnailURL ? (
                    <img alt="" className="recents-widget__thumbnail" src={item.thumbnailURL} />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="recents-widget__thumbnail recents-widget__thumbnail--empty"
                    />
                  )}
                  <span className="recents-widget__details">
                    <span className="recents-widget__name">{item.title}</span>
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
                  disabled={isSaving}
                  onClick={() => void togglePin(item)}
                  type="button"
                >
                  <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
                    <path
                      d="M5 2h6l-1 4 2 2v1H4V8l2-2-1-4ZM8 9v5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p aria-live="polite" className="recents-widget__empty">
          {emptyMessage}
        </p>
      )}
      <span aria-live="polite" className="recents-widget__status">
        {saveError}
      </span>
    </WidgetCard>
  )
}
