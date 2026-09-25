'use client'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React, { useId, useMemo, useRef, useState } from 'react'

import type { DocumentWidgetData, DocumentWidgetPreferences } from '../shared.js'

import { TabsList } from '../../../elements/Tabs/index.js'
import { GridViewIcon } from '../../../icons/GridView/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { WidgetIcon } from '../../WidgetIcon/index.js'
import { DocumentItem } from '../DocumentItem/index.js'
import { documentKey, getActivityDocuments, toggleDocumentPin } from '../shared.js'
import './index.css'

export const DocumentActivityWidget = ({
  documents,
  draftKeys,
  hasError,
  preferences: initialPreferences,
  recentKeys,
}: DocumentWidgetData) => {
  const [preferences, setPreferences] = useState(initialPreferences)
  const saveInProgress = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaveError, setHasSaveError] = useState(false)
  const [isAscending, setIsAscending] = useState(false)
  const { config } = useConfig()
  const { i18n, t } = useTranslation()
  const panelID = useId()
  const { pins, tab, view } = preferences
  const tabs = useMemo(
    () => [
      { label: t('dashboard:pinned'), value: 'pinned' as const },
      { label: t('dashboard:recentlyViewed'), value: 'recent' as const },
      { label: t('dashboard:recentDrafts'), value: 'drafts' as const },
    ],
    [t],
  )
  const pinnedKeys = new Set(pins.map(documentKey))
  const items = getActivityDocuments({
    documents,
    draftKeys,
    hasError,
    isAscending,
    preferences,
    recentKeys,
  })

  const save = async ({ next }: { next: DocumentWidgetPreferences }) => {
    if (saveInProgress.current) {
      return
    }
    saveInProgress.current = true
    setIsSaving(true)
    setHasSaveError(false)
    try {
      const response = await fetch(
        formatAdminURL({
          apiRoute: config.routes.api,
          path: `/payload-preferences/${PREFERENCE_KEYS.DASHBOARD_DOCUMENTS}`,
          serverURL: config.serverURL,
        }),
        {
          body: JSON.stringify({ value: next }),
          credentials: 'include',
          headers: { 'Accept-Language': i18n.language, 'Content-Type': 'application/json' },
          method: 'POST',
        },
      )
      if (!response.ok) {
        throw new Error('Failed to save dashboard preferences')
      }
      setPreferences(next)
    } catch {
      setHasSaveError(true)
    } finally {
      saveInProgress.current = false
      setIsSaving(false)
    }
  }

  return (
    <section
      aria-busy={isSaving}
      aria-label={t('dashboard:documents')}
      className="document-activity"
    >
      <div className="document-activity__header">
        <TabsList>
          {tabs.map((item, index) => (
            <button
              aria-controls={panelID}
              aria-selected={item.value === tab}
              className={`tabs__tab-button${item.value === tab ? ' tabs__tab-button--active' : ''}`}
              disabled={isSaving}
              id={`${panelID}-${item.value}`}
              key={item.value}
              onClick={() => void save({ next: { ...preferences, tab: item.value } })}
              onKeyDown={(event) => {
                const direction =
                  event.currentTarget.closest('[dir]')?.getAttribute('dir') === 'rtl' ? -1 : 1
                const offset =
                  event.key === 'ArrowRight'
                    ? direction
                    : event.key === 'ArrowLeft'
                      ? -direction
                      : 0
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? tabs.length - 1
                      : (index + offset + tabs.length) % tabs.length
                if (offset || event.key === 'Home' || event.key === 'End') {
                  event.preventDefault()
                  const buttons =
                    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]',
                    )
                  buttons?.[nextIndex]?.focus()
                }
              }}
              role="tab"
              tabIndex={item.value === tab ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </TabsList>
        <div aria-label={t('dashboard:viewMode')} className="document-activity__views" role="group">
          <button
            aria-label={t('dashboard:gridView')}
            aria-pressed={view === 'grid'}
            disabled={isSaving}
            onClick={() => void save({ next: { ...preferences, view: 'grid' } })}
            type="button"
          >
            <GridViewIcon />
          </button>
          <button
            aria-label={t('dashboard:listView')}
            aria-pressed={view === 'list'}
            disabled={isSaving}
            onClick={() => void save({ next: { ...preferences, view: 'list' } })}
            type="button"
          >
            <WidgetIcon name="table" />
          </button>
        </div>
      </div>
      {(hasSaveError || hasError) && (
        <p role="alert">{t(hasSaveError ? 'dashboard:saveError' : 'dashboard:loadError')}</p>
      )}
      <div aria-labelledby={`${panelID}-${tab}`} id={panelID} role="tabpanel" tabIndex={0}>
        {!items.length ? (
          <div className="document-activity__empty">
            <span className="document-activity__empty-icon">
              <WidgetIcon name={tab === 'pinned' ? 'pin' : 'table'} />
            </span>
            <div className="document-activity__empty-copy">
              <strong>
                {t(
                  tab === 'pinned'
                    ? 'dashboard:noPinned'
                    : tab === 'drafts'
                      ? 'dashboard:noDrafts'
                      : 'dashboard:noRecents',
                )}
              </strong>
              <p>
                {t(
                  tab === 'pinned'
                    ? 'dashboard:pinnedHint'
                    : tab === 'drafts'
                      ? 'dashboard:draftsHint'
                      : 'dashboard:recentsHint',
                )}
              </p>
            </div>
          </div>
        ) : (
          <>
            {view === 'list' && (
              <div className="document-activity__columns">
                <span>{t('general:name')}</span>
                <span>{t('general:collection')}</span>
                <button onClick={() => setIsAscending(!isAscending)} type="button">
                  {t('general:updatedAt')} {isAscending ? '↑' : '↓'}
                </button>
                <span>{t('dashboard:updatedBy')}</span>
              </div>
            )}
            <ul
              className={`document-activity__items document-activity__items--${view}`}
              data-tab={tab}
            >
              {items.map((doc) => (
                <DocumentItem
                  doc={doc}
                  isPinned={pinnedKeys.has(documentKey(doc))}
                  isSaving={isSaving}
                  key={documentKey(doc)}
                  onTogglePin={() =>
                    void save({
                      next: { ...preferences, pins: toggleDocumentPin({ document: doc, pins }) },
                    })
                  }
                  view={view}
                />
              ))}
              {view === 'grid' &&
                Array.from({ length: Math.max(0, 8 - items.length) }, (_, index) => (
                  <li
                    aria-hidden="true"
                    className="document-activity__placeholder"
                    key={`placeholder-${index}`}
                  />
                ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
