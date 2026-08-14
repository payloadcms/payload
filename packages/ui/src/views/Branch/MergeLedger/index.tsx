'use client'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useRef, useState } from 'react'

import type { RenderMergeDiffResult } from '../renderMergeDiff.js'

import { Link } from '../../../elements/Link/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import { ShimmerEffect } from '../../../elements/ShimmerEffect/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'merge-ledger'

export type MergeEventChange = {
  collectionSlug: string
  docID: string
  docTitle: string
  /** Set instead of `collectionSlug`/`docID` when the merged change was a global. */
  globalSlug?: string
  operation: 'create' | 'delete' | 'update'
}

export type MergeEvent = {
  changes: MergeEventChange[]
  id: string
  mergedAt: string
  mergedByLabel?: string
}

type LoadState = {
  result?: RenderMergeDiffResult
  status: 'error' | 'loading' | 'ready'
}

const operationPillStyle = {
  create: 'success',
  delete: 'error',
  update: 'warning',
} as const

/**
 * A branch's history: one section per merge event, newest first.
 *
 * Reconstructed from the ledger rather than from the branch's current state, which
 * by then holds nothing — a merge consumes the change rows it applies and drops the
 * shadow rows behind them. Titles are the ones the documents had when they merged.
 *
 * Rows expand to the diff of what that merge did, rendered from the snapshots taken
 * either side of the write. Fetched per row, because a history can hold hundreds of
 * documents and each diff is a full field-tree render.
 */
export const MergeLedger: React.FC<{ events: MergeEvent[] }> = ({ events }) => {
  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const { serverFunction } = useServerFunctions()

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [loaded, setLoaded] = useState<Record<string, LoadState>>({})

  const loadedRef = useRef(loaded)
  loadedRef.current = loaded

  const load = useCallback(
    async ({
      changeIndex,
      key,
      mergeID,
    }: {
      changeIndex: number
      key: string
      mergeID: string
    }) => {
      if (loadedRef.current[key]) {
        return
      }

      setLoaded((prev) => ({ ...prev, [key]: { status: 'loading' } }))

      try {
        const result = (await serverFunction({
          name: 'render-merge-diff',
          args: { changeIndex, mergeID },
        })) as RenderMergeDiffResult

        setLoaded((prev) => ({ ...prev, [key]: { result, status: 'ready' } }))
      } catch (_err) {
        setLoaded((prev) => ({ ...prev, [key]: { status: 'error' } }))
      }
    },
    [serverFunction],
  )

  const toggle = useCallback(
    ({ changeIndex, key, mergeID }: { changeIndex: number; key: string; mergeID: string }) => {
      // The fetch is kicked off outside the updater. A state updater must be pure —
      // React may run it during another component's render, and the `setLoaded` inside
      // `load` then lands mid-render.
      const willExpand = !expanded.has(key)

      setExpanded((prev) => {
        const next = new Set(prev)

        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }

        return next
      })

      if (willExpand) {
        void load({ changeIndex, key, mergeID })
      }
    },
    [expanded, load],
  )

  if (!events.length) {
    return null
  }

  return (
    <div className={baseClass}>
      {events.map((event) => (
        <section className={`${baseClass}__event`} key={event.id}>
          <header className={`${baseClass}__header`}>
            <h3 className={`${baseClass}__when`}>
              {t('branching:mergedOn', {
                date: new Date(event.mergedAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              })}
            </h3>
            <span className={`${baseClass}__meta`}>
              {event.mergedByLabel
                ? t('branching:mergedByCount', {
                    count: event.changes.length,
                    user: event.mergedByLabel,
                  })
                : t('branching:mergedCount', { count: event.changes.length })}
            </span>
          </header>

          <ul className={`${baseClass}__list`}>
            {event.changes.map((change, changeIndex) => {
              const collectionConfig = change.globalSlug
                ? undefined
                : getEntityConfig({ collectionSlug: change.collectionSlug })
              const globalConfig = change.globalSlug
                ? getEntityConfig({ globalSlug: change.globalSlug })
                : undefined
              const key = `${event.id}-${changeIndex}`
              const isExpanded = expanded.has(key)
              const state = loaded[key]

              return (
                <li className={`${baseClass}__row`} key={key}>
                  {/* Following `Collapsible` and the review list: an overlay button
                      takes the clicks so the whole header opens the row, and the
                      content sits above it with pointer events off. */}
                  <div className={`${baseClass}__row-header`}>
                    <button
                      aria-expanded={isExpanded}
                      className={`${baseClass}__toggle`}
                      onClick={() => toggle({ changeIndex, key, mergeID: event.id })}
                      type="button"
                    >
                      <span>{change.docTitle}</span>
                    </button>
                    <div className={`${baseClass}__row-content`}>
                      <Pill
                        className={`${baseClass}__operation`}
                        pillStyle={operationPillStyle[change.operation]}
                        size="small"
                      >
                        {t(`branching:operation_${change.operation}` as Parameters<typeof t>[0])}
                      </Pill>
                      <Pill className={`${baseClass}__entity`} pillStyle="light-gray" size="small">
                        {getTranslation(
                          globalConfig
                            ? (globalConfig.label ?? change.globalSlug)
                            : (collectionConfig?.labels?.singular ?? change.collectionSlug),
                          i18n,
                        )}
                      </Pill>
                      {/* A merged delete has no document left to open. A global has
                          somewhere to go instead: its own edit view. */}
                      {change.operation === 'delete' ? (
                        <span className={`${baseClass}__title`}>{change.docTitle}</span>
                      ) : (
                        <Link
                          className={`${baseClass}__title ${baseClass}__title--link`}
                          href={formatAdminURL({
                            adminRoute: config.routes.admin,
                            path: change.globalSlug
                              ? `/globals/${change.globalSlug}`
                              : `/collections/${change.collectionSlug}/${change.docID}`,
                          })}
                        >
                          {change.docTitle}
                        </Link>
                      )}
                      <ChevronIcon
                        className={`${baseClass}__indicator`}
                        direction={isExpanded ? 'up' : 'down'}
                        size={16}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={`${baseClass}__diff`}>
                      {state?.status === 'ready' ? state.result?.diff : null}
                      {state?.status === 'loading' || !state ? (
                        <ShimmerEffect height="3rem" />
                      ) : null}
                      {state?.status === 'error' ? (
                        <p className={`${baseClass}__error`}>{t('error:unknown')}</p>
                      ) : null}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
