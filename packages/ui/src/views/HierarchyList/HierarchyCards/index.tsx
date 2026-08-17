'use client'

import type { User } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useRef, useState } from 'react'

import type { TableRow } from '../HierarchyTable/types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { DocumentCard } from './DocumentCard/index.js'
import { FolderCard } from './FolderCard/index.js'
import './index.css'

const baseClass = 'hierarchy-card-grid'

const getRowTitle = ({ row, useAsTitle }: { row: TableRow; useAsTitle: string }): string => {
  const rawTitle = row[useAsTitle]

  if (typeof rawTitle === 'string' || typeof rawTitle === 'number') {
    return String(rawTitle)
  }

  return String(row.id)
}

/**
 * Discrete column tiers, richest-first. Each `minWidth` is the container width at which that
 * many ~200px cards (plus the grid gap) still fit, so cards never drop meaningfully below the
 * 200px target as the container grows.
 */
const COLUMN_TIERS = [
  { columns: 8, minWidth: 1712 },
  { columns: 5, minWidth: 1064 },
  { columns: 4, minWidth: 848 },
  { columns: 2, minWidth: 0 },
] as const

const getColumnCount = (containerWidth: number): number =>
  COLUMN_TIERS.find((tier) => containerWidth >= tier.minWidth)?.columns ?? 2

/**
 * Measures the grid's own width via `ResizeObserver` rather than CSS container queries, so the
 * column count is driven by explicit, easily-debuggable state instead of container-query support
 * or self-referencing-container edge cases.
 */
const useColumnCount = () => {
  const ref = useRef<HTMLUListElement>(null)
  const [columns, setColumns] = useState(2)

  useEffect(() => {
    const node = ref.current

    if (!node) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setColumns(getColumnCount(entry.contentRect.width))
      }
    })

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return [ref, columns] as const
}

/**
 * `replace` collapses the selection to the clicked card, `toggle` (Cmd/Ctrl) adds or removes it,
 * and `range` (Shift) selects everything between the anchor and the clicked card.
 */
type ClickIntent = 'range' | 'replace' | 'toggle'

/**
 * Grid-relative geometry of the drag-selection marquee.
 */
type MarqueeRect = {
  height: number
  left: number
  top: number
  width: number
}

/**
 * A press only becomes a marquee once the pointer travels this far, so a slightly imprecise click
 * on empty space still reads as a click-away rather than a zero-area drag.
 */
const DRAG_THRESHOLD = 4

const getSelectionIntent = (event: {
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}): ClickIntent => {
  if (event.shiftKey) {
    return 'range'
  }

  if (event.metaKey || event.ctrlKey) {
    return 'toggle'
  }

  return 'replace'
}

export type HierarchyCardGridProps = {
  /**
   * Accessible name for the grid, so the list is distinguishable when several groups render.
   */
  ariaLabel?: string
  /**
   * Grows the grid to fill the remaining height of its container, so click-away and drag selection
   * reach the empty space below the cards rather than only the gaps between them. Requires the
   * container to be a flex column.
   */
  fillHeight?: boolean
  /**
   * Returns the user currently editing a row, mirroring the table's lock affordance. Locked rows
   * cannot be selected, so their cards render a lock indicator.
   */
  getRowLockedUser?: (row: TableRow) => undefined | User
  /**
   * Hierarchy children render as folder cards, related documents render as document cards.
   */
  isHierarchyGroup: boolean
  /**
   * Toggles a single row's selected state. Multi-card intents (replace, range) are resolved into
   * the minimum set of per-row toggles by the grid, so consumers only implement one operation.
   */
  onSelectionChange: (row: TableRow) => void
  rows: TableRow[]
  selectedIds: Set<number | string>
}

export function HierarchyCardGrid({
  ariaLabel,
  fillHeight = false,
  getRowLockedUser,
  isHierarchyGroup,
  onSelectionChange,
  rows,
  selectedIds,
}: HierarchyCardGridProps) {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const { i18n } = useTranslation()
  const router = useRouter()
  const [gridRef, columns] = useColumnCount()

  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)

  // Origin of the next Shift+Click range, set by every plain or Cmd/Ctrl click.
  const anchorIndexRef = useRef<null | number>(null)

  /**
   * A drag binds its handlers to `window` for its whole lifetime, so those handlers have to read
   * the live rows and selection rather than the values captured when the press began - the
   * selection changes on every pointer move.
   */
  const latestRef = useRef({ getRowLockedUser, onSelectionChange, rows, selectedIds })

  useEffect(() => {
    latestRef.current = { getRowLockedUser, onSelectionChange, rows, selectedIds }
  })

  // Unmounting mid-drag would otherwise leave the window listeners bound.
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => dragCleanupRef.current?.(), [])

  const isRowSelectable = (row: TableRow) => !latestRef.current.getRowLockedUser?.(row)

  /**
   * Reduces a desired selection to the minimum set of per-row toggles the consumer understands.
   */
  const commitSelection = (nextSelectedIds: Set<number | string>) => {
    const {
      onSelectionChange: onChange,
      rows: latestRows,
      selectedIds: currentIds,
    } = latestRef.current

    latestRows.forEach((row) => {
      if (isRowSelectable(row) && currentIds.has(row.id) !== nextSelectedIds.has(row.id)) {
        onChange(row)
      }
    })
  }

  const applySelectionIntent = ({ index, intent }: { index: number; intent: ClickIntent }) => {
    const row = rows[index]

    if (!row || !isRowSelectable(row)) {
      return
    }

    const nextSelectedIds = new Set<number | string>()

    if (intent === 'range') {
      const anchorIndex = anchorIndexRef.current ?? index
      const start = Math.min(anchorIndex, index)
      const end = Math.max(anchorIndex, index)

      rows.slice(start, end + 1).forEach((rangeRow) => {
        if (isRowSelectable(rangeRow)) {
          nextSelectedIds.add(rangeRow.id)
        }
      })
    } else if (intent === 'toggle') {
      selectedIds.forEach((id) => nextSelectedIds.add(id))

      if (nextSelectedIds.has(row.id)) {
        nextSelectedIds.delete(row.id)
      } else {
        nextSelectedIds.add(row.id)
      }

      anchorIndexRef.current = index
    } else {
      nextSelectedIds.add(row.id)
      anchorIndexRef.current = index
    }

    // `selectedIds` only covers this grid, so a `replace` clears the other cards here but leaves
    // sibling groups' selections alone - each group is its own selection scope.
    commitSelection(nextSelectedIds)
  }

  /**
   * Cards have no checkbox, so the card surface itself drives selection: click selects, Cmd/Ctrl
   * click toggles, Shift click extends. Navigation moves to double click instead.
   *
   * This runs in the capture phase and stops propagation because the card's `Link` navigates from
   * its own `onClick` - a bubbling handler here would fire after the route change had already
   * started. Keyboard-triggered clicks (`detail === 0`, i.e. Enter on the focused link) are let
   * through to the link, since there is no double-press equivalent.
   */
  const handleCardClickCapture = (event: React.MouseEvent, index: number) => {
    if (event.detail === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    applySelectionIntent({ index, intent: getSelectionIntent(event) })
  }

  // Space is the keyboard counterpart of a selecting click, mirroring what the checkbox used to
  // offer; Enter stays with the focused link so it still opens the document.
  const handleCardKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== ' ') {
      return
    }

    // Space would otherwise scroll the page.
    event.preventDefault()
    applySelectionIntent({ index, intent: getSelectionIntent(event) })
  }

  const handleCardDoubleClick = (event: React.MouseEvent, href: string) => {
    event.preventDefault()
    router.push(href)
  }

  /**
   * A press on the grid's empty space either clears the selection (click-away) or draws a marquee
   * that selects every card it touches, matching a file browser. Holding a modifier keeps the
   * existing selection and adds to it.
   *
   * All coordinates are kept relative to the grid so the marquee stays anchored to the cards if
   * the page scrolls mid-drag.
   */
  const handleGridMouseDown = (event: React.MouseEvent) => {
    const gridNode = gridRef.current

    // Presses that land on a card belong to the click handlers above.
    if (
      event.button !== 0 ||
      !gridNode ||
      (event.target as HTMLElement).closest(`.${baseClass}__item`)
    ) {
      return
    }

    // Suppresses the native text-selection drag that would otherwise fight the marquee.
    event.preventDefault()

    const isAdditive = event.shiftKey || event.metaKey || event.ctrlKey
    const baseSelectedIds = new Set(selectedIds)
    const startBounds = gridNode.getBoundingClientRect()
    const startX = event.clientX - startBounds.left
    const startY = event.clientY - startBounds.top

    let hasMoved = false

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const gridBounds = gridNode.getBoundingClientRect()
      const currentX = moveEvent.clientX - gridBounds.left
      const currentY = moveEvent.clientY - gridBounds.top

      if (
        !hasMoved &&
        Math.abs(currentX - startX) < DRAG_THRESHOLD &&
        Math.abs(currentY - startY) < DRAG_THRESHOLD
      ) {
        return
      }

      hasMoved = true

      const bottom = Math.max(startY, currentY)
      const left = Math.min(startX, currentX)
      const right = Math.max(startX, currentX)
      const top = Math.min(startY, currentY)

      setMarquee({ height: bottom - top, left, top, width: right - left })

      const nextSelectedIds = isAdditive ? new Set(baseSelectedIds) : new Set<number | string>()

      // Card elements are the grid's own children in row order, so they index alongside `rows`.
      latestRef.current.rows.forEach((row, index) => {
        const itemNode = gridNode.children[index]

        if (!itemNode || !isRowSelectable(row)) {
          return
        }

        const itemBounds = itemNode.getBoundingClientRect()
        const intersects =
          itemBounds.left - gridBounds.left < right &&
          itemBounds.right - gridBounds.left > left &&
          itemBounds.top - gridBounds.top < bottom &&
          itemBounds.bottom - gridBounds.top > top

        if (intersects) {
          nextSelectedIds.add(row.id)
        }
      })

      commitSelection(nextSelectedIds)
    }

    const endDrag = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', endDrag)
      dragCleanupRef.current = null
      setMarquee(null)

      // A press that never became a drag is a click-away: it clears the selection.
      if (!hasMoved && !isAdditive) {
        commitSelection(new Set())
        anchorIndexRef.current = null
      }
    }

    dragCleanupRef.current = endDrag
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', endDrag)
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- pointer-only marquee selection layered over a list whose cards each remain keyboard-operable
    <ul
      aria-label={ariaLabel}
      className={[
        baseClass,
        isHierarchyGroup && `${baseClass}--folders`,
        fillHeight && `${baseClass}--fill-height`,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={handleGridMouseDown}
      ref={gridRef}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {rows.map((row, index) => {
        const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })
        const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
        const title = getRowTitle({ row, useAsTitle })
        const isSelected = selectedIds.has(row.id)
        const key = `${row._collectionSlug}-${row.id}`
        const lockedUser = getRowLockedUser?.(row)

        const hierarchyConfig =
          collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
            ? collectionConfig.hierarchy
            : undefined
        const parentFieldName = hierarchyConfig?.parentFieldName || 'parent'

        const href = isHierarchyGroup
          ? formatAdminURL({
              adminRoute,
              path: `/collections/${row._collectionSlug}?${parentFieldName}=${row.id}`,
            })
          : formatAdminURL({
              adminRoute,
              path: `/collections/${row._collectionSlug}/${row.id}`,
            })

        return (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the card's own link remains the keyboard-operable control; these handlers only layer pointer selection gestures on top of it
          <li
            className={`${baseClass}__item`}
            key={key}
            onClickCapture={(event) => handleCardClickCapture(event, index)}
            onDoubleClick={(event) => handleCardDoubleClick(event, href)}
            onKeyDown={(event) => handleCardKeyDown(event, index)}
          >
            {isHierarchyGroup ? (
              <FolderCard
                hasChildren={Boolean(row._hasChildren)}
                href={href}
                icon={row._hierarchyIcon}
                isSelected={isSelected}
                lockedUser={lockedUser}
                title={title}
              />
            ) : (
              <DocumentCard
                collectionSlug={row._collectionSlug}
                doc={row}
                href={href}
                isSelected={isSelected}
                lockedUser={lockedUser}
                showType
                // The pill labels a single document, so the singular label reads correctly
                // ("Media"); _collectionLabel is the plural used for the table column heading.
                typeLabel={
                  getTranslation(collectionConfig?.labels?.singular, i18n) || row._collectionLabel
                }
                updatedAt={typeof row.updatedAt === 'string' ? row.updatedAt : undefined}
              />
            )}
          </li>
        )
      })}

      {/*
        A list item rather than a bare div so the list's content model stays valid; it is absolutely
        positioned, so it is out of flow and never occupies a grid cell. Physical `left`/`top` are
        deliberate - the geometry comes from measured rects, which are already physical.
      */}
      {marquee && (
        <li
          aria-hidden="true"
          className={`${baseClass}__marquee`}
          style={{
            height: marquee.height,
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
          }}
        />
      )}
    </ul>
  )
}
