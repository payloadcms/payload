'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useHoverSubmenuGroup } from './HoverSubmenuGroup.js'

const HOVER_CLOSE_DELAY = 75
const POLYGON_BUFFER = 2

type Point = [x: number, y: number]

const isInsideRect = (x: number, y: number, rect: DOMRect) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

const isInsideAxisAlignedRect = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

const hasIntersectingEdge = (
  px: number,
  py: number,
  xi: number,
  yi: number,
  xj: number,
  yj: number,
) => yi >= py !== yj >= py && px <= ((xj - xi) * (py - yi)) / (yj - yi) + xi

/** Ray-casting point-in-polygon test, ported from Floating UI's `safePolygon`. */
const isPointInPolygon = (px: number, py: number, points: Point[]) => {
  let inside = false
  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[(i + 1) % points.length]
    if (hasIntersectingEdge(px, py, xi, yi, xj, yj)) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Computes the funnel-shaped safe zone connecting `anchor` (the last cursor position over
 * the trigger) to the content panel, ported from Floating UI's `safePolygon` 'left'/'right'
 * cases. Unlike a bounding-box union, this narrows toward the panel, so hovering something
 * far below/above the trigger-to-panel path (e.g. an unrelated item below a short submenu)
 * correctly falls outside the zone.
 */
const getFunnelPolygon = (
  anchor: { x: number; y: number },
  triggerRect: DOMRect,
  contentRect: DOMRect,
  contentIsLeft: boolean,
): Point[] => {
  const isContentTaller = contentRect.height > triggerRect.height
  const leaveFromBottom = anchor.y > contentRect.bottom - contentRect.height / 2

  const yOffset = isContentTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4
  const pointOneY = isContentTaller
    ? anchor.y + yOffset
    : leaveFromBottom
      ? anchor.y + yOffset
      : anchor.y - yOffset
  const pointTwoY = isContentTaller
    ? anchor.y - yOffset
    : leaveFromBottom
      ? anchor.y + yOffset
      : anchor.y - yOffset

  if (contentIsLeft) {
    const cursorPointX = anchor.x + POLYGON_BUFFER + 1
    const commonXTop = leaveFromBottom
      ? contentRect.right - POLYGON_BUFFER
      : isContentTaller
        ? contentRect.right - POLYGON_BUFFER
        : contentRect.left
    const commonXBottom = leaveFromBottom
      ? isContentTaller
        ? contentRect.right - POLYGON_BUFFER
        : contentRect.left
      : contentRect.right - POLYGON_BUFFER

    return [
      [commonXTop, contentRect.top],
      [commonXBottom, contentRect.bottom],
      [cursorPointX, pointOneY],
      [cursorPointX, pointTwoY],
    ]
  }

  const cursorPointX = anchor.x - POLYGON_BUFFER
  const commonXTop = leaveFromBottom
    ? contentRect.left + POLYGON_BUFFER
    : isContentTaller
      ? contentRect.left + POLYGON_BUFFER
      : contentRect.right
  const commonXBottom = leaveFromBottom
    ? isContentTaller
      ? contentRect.left + POLYGON_BUFFER
      : contentRect.right
    : contentRect.left + POLYGON_BUFFER

  return [
    [cursorPointX, pointOneY],
    [cursorPointX, pointTwoY],
    [commonXTop, contentRect.top],
    [commonXBottom, contentRect.bottom],
  ]
}

/**
 * Opens a submenu on hover and keeps it open while the cursor is inside the trigger, the
 * content, the trough between them, or the funnel-shaped safe zone connecting the two -
 * closing once it has genuinely left all of those for `HOVER_CLOSE_DELAY`.
 *
 * `id` identifies this submenu within its `HoverSubmenuGroupProvider` (if any) - when
 * a sibling submenu becomes active, this one closes immediately rather than waiting on
 * its own hover-out timer.
 */
export const useHoverSubmenu = (id: string) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
  const anchorRef = useRef<{ x: number; y: number } | null>(null)
  const hasLandedRef = useRef(false)
  const group = useHoverSubmenuGroup()

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      return
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      closeTimeoutRef.current = null
    }, HOVER_CLOSE_DELAY)
  }, [])

  const open = useCallback(
    (e?: { clientX: number; clientY: number }) => {
      cancelClose()
      hasLandedRef.current = false
      if (e) {
        anchorRef.current = { x: e.clientX, y: e.clientY }
      }
      group?.setActiveId(id)
      setIsOpen(true)
    },
    [cancelClose, group, id],
  )

  // For the content panel's own onMouseEnter - just cancels a pending close and marks us
  // as "landed", without touching the trigger anchor point `open()` seeds.
  const keepOpen = useCallback(() => {
    cancelClose()
    hasLandedRef.current = true
  }, [cancelClose])

  const close = useCallback(() => {
    cancelClose()
    setIsOpen(false)
    group?.setActiveId((current) => (current === id ? null : current))
  }, [cancelClose, group, id])

  // A sibling became active (its trigger was hovered) - force-close this one now,
  // instead of relying on this submenu's own hover-zone timeout to eventually catch up.
  useEffect(() => {
    if (isOpen && group && group.activeId !== null && group.activeId !== id) {
      cancelClose()
      setIsOpen(false)
    }
  }, [group, isOpen, id, cancelClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerMove = (e: MouseEvent) => {
      const triggerRect = triggerRef.current?.getBoundingClientRect()
      const contentRect = contentRef.current?.getBoundingClientRect()
      if (!triggerRect || !contentRect) {
        return
      }

      const { clientX, clientY } = e

      if (isInsideRect(clientX, clientY, triggerRect)) {
        anchorRef.current = { x: clientX, y: clientY }
        hasLandedRef.current = false
        cancelClose()
        return
      }

      if (isInsideRect(clientX, clientY, contentRect)) {
        hasLandedRef.current = true
        cancelClose()
        return
      }

      const contentIsLeft = contentRect.right <= triggerRect.left + 1
      const isContentTaller = contentRect.height > triggerRect.height
      const boundTop = (isContentTaller ? triggerRect : contentRect).top
      const boundBottom = (isContentTaller ? triggerRect : contentRect).bottom

      // Cursor has already moved past the trigger, away from the content entirely - no
      // amount of funnel forgiveness should keep it open.
      const movedPastTrigger = contentIsLeft
        ? clientX >= triggerRect.right - 1
        : clientX <= triggerRect.left + 1

      // The strip directly between the trigger and content is always safe, regardless of
      // funnel shape - prevents flapping when moving back and forth in the gap.
      const troughX1 = contentIsLeft ? contentRect.right - 1 : triggerRect.right - 1
      const troughX2 = contentIsLeft ? triggerRect.left + 1 : contentRect.left + 1
      const isInsideTrough = isInsideAxisAlignedRect(
        clientX,
        clientY,
        troughX1,
        boundBottom,
        troughX2,
        boundTop,
      )

      if (movedPastTrigger) {
        scheduleClose()
        return
      }

      if (isInsideTrough) {
        cancelClose()
        return
      }

      if (hasLandedRef.current) {
        scheduleClose()
        return
      }

      const anchor = anchorRef.current ?? {
        x: contentIsLeft ? triggerRect.left : triggerRect.right,
        y: (triggerRect.top + triggerRect.bottom) / 2,
      }

      const polygon = getFunnelPolygon(anchor, triggerRect, contentRect, contentIsLeft)
      const isInsidePolygon = isPointInPolygon(clientX, clientY, polygon)

      if (isInsidePolygon) {
        cancelClose()
      } else {
        scheduleClose()
      }
    }

    document.addEventListener('mousemove', handlePointerMove)
    return () => document.removeEventListener('mousemove', handlePointerMove)
  }, [isOpen, cancelClose, scheduleClose])

  return { close, contentRef, isOpen, keepOpen, open, triggerRef }
}
