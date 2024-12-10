'use client'
import type React from 'react'

import { getBoundingClientRectWithoutTransform } from './getBoundingRectWithoutTransform.js'

export function highlightElemOriginalPosition(
  debugHighlightRef: React.RefObject<HTMLDivElement | null>,
  htmlElem: HTMLElement,
  anchorElem: HTMLElement,
) {
  if (!debugHighlightRef.current) {
    // If the ref doesn't point to an existing element, we can't set styles
    return
  }

  const { left: anchorLeft, top: anchorTop } = anchorElem.getBoundingClientRect()

  // Get computed styles of the given element
  const boundingRect = getBoundingClientRectWithoutTransform(htmlElem)

  // Extract necessary styles (ignoring transform)
  const width = boundingRect.width
  const height = boundingRect.height
  const top = boundingRect.top - anchorTop
  const left = boundingRect.left - anchorLeft

  debugHighlightRef.current.style.border = '2px solid green'
  debugHighlightRef.current.style.boxSizing = 'border-box'
  debugHighlightRef.current.style.height = height + 'px'
  debugHighlightRef.current.style.pointerEvents = 'none'
  debugHighlightRef.current.style.position = 'absolute'
  debugHighlightRef.current.style.top = top + 'px'
  debugHighlightRef.current.style.left = left + 'px'
  debugHighlightRef.current.style.width = width + 'px'
  debugHighlightRef.current.style.zIndex = '1000'
  debugHighlightRef.current.style.opacity = '0.5'
}
