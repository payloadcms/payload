'use client'

import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { RenderBranchDiffResult } from '../renderBranchDiff.js'

import { Pill } from '../../../elements/Pill/index.js'
import { ShimmerEffect } from '../../../elements/ShimmerEffect/index.js'
import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'changed-docs'

export type BranchChange = {
  /** Absent for a global, which has one of itself and so needs no document ID. */
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
  id: string
  operation: 'create' | 'delete' | 'update'
}

type LoadState = {
  result?: RenderBranchDiffResult
  status: 'error' | 'loading' | 'ready'
}

const operationPillStyle = {
  create: 'success',
  delete: 'error',
  update: 'warning',
} as const

/**
 * The changed documents on a branch, one collapsible row each.
 *
 * Diffs are fetched per row rather than with the page. A branch can hold hundreds
 * of changes and each diff is a full field-tree render on the server, so building
 * them all up front would dominate the page load for a list most of which is never
 * opened. A row loads when it is expanded, and is prefetched once it scrolls into
 * view so that opening one feels instant.
 */
export const ChangedDocuments: React.FC<{
  branch: string
  changes: BranchChange[]
  /**
   * Off for a list that is describing rather than deciding — a scheduled merge's
   * documents, where what merges is already settled. The rows and their diffs are
   * identical either way; only the choosing is dropped.
   */
  selectable?: boolean
  /** Owned by `BranchChanges`, because the merge action needs to read it too. */
  selected?: Set<string>
  toggleAll?: () => void
  toggleSelected?: (id: string) => void
}> = ({
  branch,
  changes,
  selectable = true,
  selected = emptySelection,
  toggleAll,
  toggleSelected,
}) => {
  const { serverFunction } = useServerFunctions()
  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [loaded, setLoaded] = useState<Record<string, LoadState>>({})

  // Read inside the loader without making it a dependency, so a completed load
  // doesn't re-create the callback and re-trigger observers.
  const loadedRef = useRef(loaded)
  loadedRef.current = loaded

  const load = useCallback(
    async (change: BranchChange) => {
      if (loadedRef.current[change.id]) {
        return
      }

      setLoaded((prev) => ({ ...prev, [change.id]: { status: 'loading' } }))

      try {
        const result = (await serverFunction({
          name: 'render-branch-diff',
          args: {
            branch,
            collectionSlug: change.collectionSlug,
            docID: change.docID,
            globalSlug: change.globalSlug,
            operation: change.operation,
          },
        })) as RenderBranchDiffResult

        setLoaded((prev) => ({ ...prev, [change.id]: { result, status: 'ready' } }))
      } catch (_err) {
        setLoaded((prev) => ({ ...prev, [change.id]: { status: 'error' } }))
      }
    },
    [branch, serverFunction],
  )

  const allSelected = selected.size === changes.length && changes.length > 0

  const toggleExpanded = useCallback(
    (change: BranchChange) => {
      // Outside the updater: a state updater must be pure, and React may run it
      // during another component's render, which puts `load`'s `setLoaded` mid-render.
      const willExpand = !expanded.has(change.id)

      setExpanded((prev) => {
        const next = new Set(prev)

        if (next.has(change.id)) {
          next.delete(change.id)
        } else {
          next.add(change.id)
        }

        return next
      })

      if (willExpand) {
        void load(change)
      }
    },
    [expanded, load],
  )

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__controls`}>
        {selectable && (
          <CheckboxInput
            checked={allSelected}
            id={`${baseClass}-select-all`}
            label={t('general:selectAll', {
              count: changes.length,
              label: t('general:documents'),
            })}
            onToggle={toggleAll}
            partialChecked={!allSelected && selected.size > 0}
          />
        )}
        <span className={`${baseClass}__count`}>
          {t('branching:changedDocuments')} {changes.length}
        </span>
      </div>

      <ul className={`${baseClass}__list`}>
        {changes.map((change) => (
          <ChangedDocumentRow
            change={change}
            collectionLabel={getTranslation(
              change.globalSlug
                ? (getEntityConfig({ globalSlug: change.globalSlug })?.label ?? change.globalSlug)
                : (getEntityConfig({ collectionSlug: change.collectionSlug })?.labels?.singular ??
                    change.collectionSlug),
              i18n,
            )}
            isExpanded={expanded.has(change.id)}
            isSelected={selected.has(change.id)}
            key={change.id}
            load={load}
            selectable={selectable}
            state={loaded[change.id]}
            toggleExpanded={toggleExpanded}
            toggleSelected={toggleSelected}
          />
        ))}
      </ul>
    </div>
  )
}

const emptySelection: Set<string> = new Set()

const ChangedDocumentRow: React.FC<{
  change: BranchChange
  collectionLabel: string
  isExpanded: boolean
  isSelected: boolean
  load: (change: BranchChange) => Promise<void>
  selectable: boolean
  state?: LoadState
  toggleExpanded: (change: BranchChange) => void
  toggleSelected?: (id: string) => void
}> = ({
  change,
  collectionLabel,
  isExpanded,
  isSelected,
  load,
  selectable,
  state,
  toggleExpanded,
  toggleSelected,
}) => {
  const { t } = useTranslation()
  const rowRef = useRef<HTMLLIElement>(null)

  // Prefetch on approach, so the diff is usually already there by the time the row
  // is opened. Disconnects after firing once — this is a warm-up, not a subscription.
  useEffect(() => {
    const node = rowRef.current

    if (!node || state) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void load(change)
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [change, load, state])

  const title = state?.result?.title ?? String(change.docID)

  return (
    <li className={`${baseClass}__row`} ref={rowRef}>
      {/* The row opens from anywhere in its header. Following `Collapsible`: an
          overlay button takes the clicks, the header content sits above it with
          pointer events off, and the checkbox turns them back on for itself. */}
      <div className={`${baseClass}__header`}>
        <button
          aria-expanded={isExpanded}
          className={`${baseClass}__toggle`}
          onClick={() => toggleExpanded(change)}
          type="button"
        >
          <span>{title}</span>
        </button>
        {/* Operation first, then entity, then title: the row reads as a sentence —
            "Created Page — Spooky Exclusive" — and the operation is what the eye
            scans a long changeset for, so it anchors the left edge where every
            row's copy starts at the same x. */}
        <div className={`${baseClass}__header-content`}>
          {selectable && (
            <span className={`${baseClass}__select`}>
              <CheckboxInput
                checked={isSelected}
                id={`${baseClass}-${change.id}`}
                label=""
                onToggle={() => toggleSelected?.(change.id)}
              />
            </span>
          )}
          <Pill
            className={`${baseClass}__operation`}
            pillStyle={operationPillStyle[change.operation]}
            size="small"
          >
            {t(`branching:operation_${change.operation}` as Parameters<typeof t>[0])}
          </Pill>
          <Pill className={`${baseClass}__entity`} pillStyle="light-gray" size="small">
            {collectionLabel}
          </Pill>
          <span className={`${baseClass}__title`}>{title}</span>
          <ChevronIcon
            className={`${baseClass}__indicator`}
            direction={isExpanded ? 'up' : 'down'}
            size={16}
          />
        </div>
      </div>

      {isExpanded ? (
        <div className={`${baseClass}__diff`}>
          {state?.status === 'ready' ? state.result?.diff : null}
          {state?.status === 'loading' || !state ? <ShimmerEffect height="3rem" /> : null}
          {state?.status === 'error' ? (
            <p className={`${baseClass}__error`}>{t('error:unknown')}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
