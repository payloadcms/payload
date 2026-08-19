'use client'

import type { User } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { HierarchyDragData } from '../../../providers/HierarchyDnd/types.js'
import type { TableRow } from '../HierarchyTable/types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { DragPreviewItem } from './DragPreviewItem/index.js'
import { PlaneItem } from './PlaneItem/index.js'
import './index.css'

const baseClass = 'hierarchy-card-grid'

/**
 * Rows are drawn from several collections whose ids can collide, so identity is the pair.
 */
export const getRowKey = (row: TableRow): string => `${row._collectionSlug}:${row.id}`

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
 * Measures the plane's own width via `ResizeObserver` rather than CSS container queries, so the
 * column count is driven by explicit, easily-debuggable state instead of container-query support
 * or self-referencing-container edge cases. Every band shares the count, so folder cards and
 * document cards line up in the same columns.
 */
const useColumnCount = () => {
  const ref = useRef<HTMLDivElement>(null)
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
 * Plane-relative geometry of the drag-selection marquee.
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

/** Matches the overlay's own cap, so no preview card is built that the overlay would discard. */
const MAX_DRAG_PREVIEW_CARDS = 3

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

/**
 * A row plus the presentation values derived from its collection config.
 */
type CardDescriptor = {
  href: string
  isHierarchyGroup: boolean
  key: string
  parentFieldName: string
  row: TableRow
  title: string
}

/**
 * One horizontal group of cards. Bands stack vertically and share a single selection scope, so a
 * range selection or a marquee can run from a folder straight through the documents below it.
 */
export type PlaneBand = {
  /**
   * Hierarchy rows render as folder cards, related documents render as document cards.
   */
  isHierarchyGroup: boolean
  key: string
  /**
   * Accessible name for this band, so each list is distinguishable when several render.
   */
  label?: string
  rows: TableRow[]
  /**
   * Rendered as the band's last cell — used for the "New Folder" tile.
   */
  TrailingItem?: React.ReactNode
}

export type HierarchyCardGridProps = {
  /**
   * Ids of the folders between the root and the folder currently open, so a folder can't be dropped
   * into its own subtree.
   */
  ancestorIds?: (number | string)[]
  /**
   * Fallback accessible name for bands that don't carry their own label.
   */
  ariaLabel?: string
  bands: PlaneBand[]
  /**
   * Grows the plane to fill the remaining height of its container, so click-away and drag selection
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
   * Slug of the collection that owns the folder tree, used to address drop destinations.
   */
  hierarchySlug?: string
  /**
   * Clears the selection once a drop has moved it, since those documents are no longer on this page.
   */
  onMoveSuccess?: () => void
  /**
   * Toggles a single row's selected state. Multi-card intents (replace, range) are resolved into
   * the minimum set of per-row toggles by the plane, so consumers only implement one operation.
   */
  onSelectionChange: (row: TableRow) => void
  selectedKeys: Set<string>
  /**
   * Renders each document card's collection label as a pill over its thumbnail. Defaults to showing
   * the pill only when the documents span more than one collection - a grid of a single document
   * type labels itself, so the pill would repeat the same word on every card.
   */
  showCollectionType?: boolean
}

export function HierarchyCardGrid({
  ancestorIds = [],
  ariaLabel,
  bands,
  fillHeight = false,
  getRowLockedUser,
  hierarchySlug,
  onMoveSuccess,
  onSelectionChange,
  selectedKeys,
  showCollectionType,
}: HierarchyCardGridProps) {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
  const router = useRouter()
  const [planeRef, columns] = useColumnCount()

  /**
   * Selection, range anchoring, and the marquee all operate over one flat index space, which is
   * what puts folders and documents on the same plane rather than in sibling scopes.
   */
  const flatRows = useMemo(() => bands.flatMap((band) => band.rows), [bands])

  /**
   * Everything needed to render one card, flattened into the same index space as `flatRows`. Built
   * once so the render and the drag overlay agree on titles and hrefs without recomputing them.
   */
  const descriptors = useMemo<CardDescriptor[]>(
    () =>
      bands.flatMap((band) =>
        band.rows.map((row) => {
          const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })
          const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'

          const hierarchyConfig =
            collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
              ? collectionConfig.hierarchy
              : undefined
          const parentFieldName = hierarchyConfig?.parentFieldName || 'parent'

          // Folders drill in via `_browseHref` so the click stays in the collection being browsed;
          // the fallback covers rows built outside the hierarchy view.
          const href = band.isHierarchyGroup
            ? (row._browseHref ??
              formatAdminURL({
                adminRoute,
                path: `/collections/${row._collectionSlug}?${parentFieldName}=${row.id}`,
              }))
            : formatAdminURL({
                adminRoute,
                path: `/collections/${row._collectionSlug}/${row.id}`,
              })

          return {
            href,
            isHierarchyGroup: band.isHierarchyGroup,
            key: getRowKey(row),
            parentFieldName,
            row,
            title: getRowTitle({ row, useAsTitle }),
          }
        }),
      ),
    [adminRoute, bands, getEntityConfig],
  )

  const showTypePill = useMemo(() => {
    if (showCollectionType !== undefined) {
      return showCollectionType
    }

    const documentSlugs = new Set(
      bands
        .filter((band) => !band.isHierarchyGroup)
        .flatMap((band) => band.rows)
        .map((row) => row._collectionSlug),
    )

    return documentSlugs.size > 1
  }, [bands, showCollectionType])

  /**
   * Payload for dragging the current selection, shared by every selected card so it is built once
   * per render rather than once per card. The preview is capped because the overlay only fans a few
   * cards before collapsing the remainder into a count.
   */
  const selectionDragData = useMemo<HierarchyDragData>(() => {
    const selected = descriptors.filter((descriptor) => selectedKeys.has(descriptor.key))

    return {
      type: 'hierarchy-items',
      items: selected.map((descriptor) => ({
        id: descriptor.row.id,
        collectionSlug: descriptor.row._collectionSlug,
        title: descriptor.title,
      })),
      onMoveSuccess,
      preview: selected
        .slice(0, MAX_DRAG_PREVIEW_CARDS)
        .map((descriptor) => (
          <DragPreviewItem
            isHierarchyGroup={descriptor.isHierarchyGroup}
            key={descriptor.key}
            row={descriptor.row}
          />
        )),
    }
  }, [descriptors, onMoveSuccess, selectedKeys])

  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)

  // Origin of the next Shift+Click range, set by every plain or Cmd/Ctrl click.
  const anchorIndexRef = useRef<null | number>(null)

  /**
   * Flat index → card element. The cards live across several lists now, so the marquee can no
   * longer hit-test by walking one element's children.
   */
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())

  const setItemRef = useCallback((flatIndex: number, node: HTMLElement | null) => {
    if (node) {
      itemRefs.current.set(flatIndex, node)
    } else {
      itemRefs.current.delete(flatIndex)
    }
  }, [])

  /**
   * A drag binds its handlers to `window` for its whole lifetime, so those handlers have to read
   * the live rows and selection rather than the values captured when the press began - the
   * selection changes on every pointer move.
   */
  const latestRef = useRef({ flatRows, getRowLockedUser, onSelectionChange, selectedKeys })

  useEffect(() => {
    latestRef.current = { flatRows, getRowLockedUser, onSelectionChange, selectedKeys }
  })

  // Unmounting mid-drag would otherwise leave the window listeners bound.
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => dragCleanupRef.current?.(), [])

  const isRowSelectable = (row: TableRow) => !latestRef.current.getRowLockedUser?.(row)

  /**
   * Reduces a desired selection to the minimum set of per-row toggles the consumer understands.
   */
  const commitSelection = (nextSelectedKeys: Set<string>) => {
    const {
      flatRows: latestRows,
      onSelectionChange: onChange,
      selectedKeys: currentKeys,
    } = latestRef.current

    latestRows.forEach((row) => {
      const key = getRowKey(row)

      if (isRowSelectable(row) && currentKeys.has(key) !== nextSelectedKeys.has(key)) {
        onChange(row)
      }
    })
  }

  const applySelectionIntent = ({ index, intent }: { index: number; intent: ClickIntent }) => {
    const row = flatRows[index]

    if (!row || !isRowSelectable(row)) {
      return
    }

    const nextSelectedKeys = new Set<string>()

    if (intent === 'range') {
      const anchorIndex = anchorIndexRef.current ?? index
      const start = Math.min(anchorIndex, index)
      const end = Math.max(anchorIndex, index)

      flatRows.slice(start, end + 1).forEach((rangeRow) => {
        if (isRowSelectable(rangeRow)) {
          nextSelectedKeys.add(getRowKey(rangeRow))
        }
      })
    } else if (intent === 'toggle') {
      selectedKeys.forEach((key) => nextSelectedKeys.add(key))

      const key = getRowKey(row)

      if (nextSelectedKeys.has(key)) {
        nextSelectedKeys.delete(key)
      } else {
        nextSelectedKeys.add(key)
      }

      anchorIndexRef.current = index
    } else {
      nextSelectedKeys.add(getRowKey(row))
      anchorIndexRef.current = index
    }

    commitSelection(nextSelectedKeys)
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

  // Pressing an unselected card collapses the selection onto it, so a drag that starts from it moves
  // only that card. The pointer sensor's own distance threshold means this lands before any drag.
  const handlePointerDownUnselected = (index: number) => {
    applySelectionIntent({ index, intent: 'replace' })
  }

  const handleCardDoubleClick = (event: React.MouseEvent, href: string) => {
    event.preventDefault()
    router.push(href)
  }

  /**
   * A press on the plane's empty space either clears the selection (click-away) or draws a marquee
   * that selects every card it touches, matching a file browser. Holding a modifier keeps the
   * existing selection and adds to it.
   *
   * All coordinates are kept relative to the plane so the marquee stays anchored to the cards if
   * the page scrolls mid-drag.
   */
  const handlePlaneMouseDown = (event: React.MouseEvent) => {
    const planeNode = planeRef.current

    // Presses that land on a card belong to the click handlers above.
    if (
      event.button !== 0 ||
      !planeNode ||
      (event.target as HTMLElement).closest(`.${baseClass}__item`)
    ) {
      return
    }

    // Suppresses the native text-selection drag that would otherwise fight the marquee.
    event.preventDefault()

    const isAdditive = event.shiftKey || event.metaKey || event.ctrlKey
    const baseSelectedKeys = new Set(selectedKeys)
    const startBounds = planeNode.getBoundingClientRect()
    const startX = event.clientX - startBounds.left
    const startY = event.clientY - startBounds.top

    let hasMoved = false

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const planeBounds = planeNode.getBoundingClientRect()
      const currentX = moveEvent.clientX - planeBounds.left
      const currentY = moveEvent.clientY - planeBounds.top

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

      const nextSelectedKeys = isAdditive ? new Set(baseSelectedKeys) : new Set<string>()

      latestRef.current.flatRows.forEach((row, index) => {
        const itemNode = itemRefs.current.get(index)

        if (!itemNode || !isRowSelectable(row)) {
          return
        }

        const itemBounds = itemNode.getBoundingClientRect()
        const intersects =
          itemBounds.left - planeBounds.left < right &&
          itemBounds.right - planeBounds.left > left &&
          itemBounds.top - planeBounds.top < bottom &&
          itemBounds.bottom - planeBounds.top > top

        if (intersects) {
          nextSelectedKeys.add(getRowKey(row))
        }
      })

      commitSelection(nextSelectedKeys)
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
    <div
      className={[baseClass, fillHeight && `${baseClass}--fill-height`].filter(Boolean).join(' ')}
      onMouseDown={handlePlaneMouseDown}
      ref={planeRef}
    >
      {bands.map((band, bandIndex) => {
        // Bands render in order, so each band's rows start after every earlier band's rows.
        const bandOffset = bands
          .slice(0, bandIndex)
          .reduce((total, earlier) => total + earlier.rows.length, 0)

        return (
          <ul
            aria-label={band.label ?? ariaLabel}
            className={[
              `${baseClass}__band`,
              band.isHierarchyGroup && `${baseClass}__band--folders`,
            ]
              .filter(Boolean)
              .join(' ')}
            key={band.key}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {band.rows.map((_row, rowIndex) => {
              const flatIndex = bandOffset + rowIndex
              const descriptor = descriptors[flatIndex]

              return (
                <PlaneItem
                  ancestorIds={ancestorIds}
                  baseClass={baseClass}
                  flatIndex={flatIndex}
                  hierarchySlug={hierarchySlug ?? descriptor.row._collectionSlug}
                  href={descriptor.href}
                  isHierarchyGroup={descriptor.isHierarchyGroup}
                  isSelected={selectedKeys.has(descriptor.key)}
                  key={descriptor.key}
                  lockedUser={getRowLockedUser?.(descriptor.row)}
                  onClickCapture={handleCardClickCapture}
                  onDoubleClick={handleCardDoubleClick}
                  onKeyDown={handleCardKeyDown}
                  onPointerDownUnselected={handlePointerDownUnselected}
                  parentFieldName={descriptor.parentFieldName}
                  registerNode={setItemRef}
                  row={descriptor.row}
                  selectionDragData={selectionDragData}
                  showTypePill={showTypePill}
                  title={descriptor.title}
                />
              )
            })}

            {band.TrailingItem ? (
              <li className={`${baseClass}__item ${baseClass}__item--trailing`}>
                {band.TrailingItem}
              </li>
            ) : null}
          </ul>
        )
      })}

      {/*
        Inert overlay, positioned against the plane rather than any one band so it can span them.
        Physical `left`/`top` are deliberate - the geometry comes from measured rects, which are
        already physical.
      */}
      {marquee && (
        <div
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
    </div>
  )
}
