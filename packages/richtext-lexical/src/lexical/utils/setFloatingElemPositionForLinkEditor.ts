'use client'
const VERTICAL_GAP = 10
const HORIZONTAL_OFFSET = 5

export function setFloatingElemPositionForLinkEditor(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  verticalGap: number = VERTICAL_GAP,
  horizontalOffset: number = HORIZONTAL_OFFSET,
): void {
  const scrollerElem = anchorElem.parentElement

  if (targetRect === null || scrollerElem == null) {
    floatingElem.style.opacity = '0'
    floatingElem.style.transform = 'translate(-10000px, -10000px)'
    return
  }

  const anchorElementRect = anchorElem.getBoundingClientRect()
  const editorScrollerRect = scrollerElem.getBoundingClientRect()

  let top = targetRect.top - verticalGap
  let left = targetRect.left - horizontalOffset

  // Reset width constraints to measure natural content size
  floatingElem.style.width = 'max-content'
  floatingElem.style.maxWidth = 'none'
  const naturalWidth = floatingElem.scrollWidth

  // Calculate available space on both sides to determine tooltip width
  const availableRight = editorScrollerRect.right - left
  const availableLeft = left - editorScrollerRect.left

  let floatingElemRect: DOMRect

  // Only constrain width if content doesn't fit in available space
  if (naturalWidth <= availableRight) {
    // Content fits naturally on the right, don't constrain
    floatingElemRect = floatingElem.getBoundingClientRect()
  } else {
    // Content doesn't fit on right, choose side with more space
    const availableLeftTotal = availableLeft + targetRect.width
    const useLeftSide = availableLeft > availableRight
    const availableSpace = useLeftSide ? availableLeftTotal : availableRight
    const tooltipWidth = Math.min(naturalWidth, availableSpace)

    // Apply width constraint if needed
    if (tooltipWidth < naturalWidth) {
      floatingElem.style.width = `${tooltipWidth}px`
      floatingElem.style.maxWidth = `${tooltipWidth}px`
      void floatingElem.offsetHeight
    }

    // Position on chosen side
    if (useLeftSide) {
      left = targetRect.right - tooltipWidth
    }

    floatingElemRect = floatingElem.getBoundingClientRect()
  }

  if (top < editorScrollerRect.top) {
    top += floatingElemRect.height + targetRect.height + verticalGap * 2
  }

  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset
  }

  top -= anchorElementRect.top
  left -= anchorElementRect.left

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${left}px, ${top}px)`
}
