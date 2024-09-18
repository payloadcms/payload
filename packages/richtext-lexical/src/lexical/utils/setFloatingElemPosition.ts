'use client'
const VERTICAL_GAP = 10
const HORIZONTAL_OFFSET = 32

// TODO: needs refactoring
// This is supposed to position the floatingElem based on the parent (anchorElem) and the target (targetRect) which is usually the selected text.
// So basically, it positions the floatingElem either below or above the target (targetRect) and aligns it to the left or center of the target (targetRect).
// This is used for positioning the floating toolbar (anchor: richtext editor) and its caret (anchor: floating toolbar)
export function setFloatingElemPosition(args: {
  alwaysDisplayOnTop?: boolean
  anchorElem: HTMLElement
  anchorFlippedOffset?: number // Offset which was added to the anchor (for caret, floating toolbar) if it was flipped
  floatingElem: HTMLElement
  horizontalOffset?: number
  horizontalPosition?: 'center' | 'left'
  specialHandlingForCaret?: boolean
  targetRect: ClientRect | null
  verticalGap?: number
}): number | undefined {
  const {
    alwaysDisplayOnTop = false,
    anchorElem,
    anchorFlippedOffset = 0, // Offset which was added to the anchor (for caret, floating toolbar) if it was flipped
    floatingElem,
    horizontalOffset = HORIZONTAL_OFFSET,
    horizontalPosition = 'left',
    specialHandlingForCaret = false,
    targetRect,
    verticalGap = VERTICAL_GAP,
  } = args
  // Returns the top offset if the target was flipped
  const scrollerElem = anchorElem.parentElement

  if (targetRect === null || scrollerElem == null) {
    floatingElem.style.opacity = '0'
    floatingElem.style.transform = 'translate(-10000px, -10000px)'
    return
  }

  const floatingElemRect = floatingElem.getBoundingClientRect()
  const anchorElementRect = anchorElem.getBoundingClientRect()
  const editorScrollerRect = scrollerElem.getBoundingClientRect()

  let top = targetRect.top - floatingElemRect.height - verticalGap
  let left = targetRect.left - horizontalOffset

  if (horizontalPosition === 'center') {
    // Calculate left to position floatingElem to the horizontal middle of targetRect
    left = targetRect.left + targetRect.width / 2 - floatingElemRect.width / 2
  }

  let addedToTop = 0
  if (!alwaysDisplayOnTop && top < editorScrollerRect.top && !specialHandlingForCaret) {
    addedToTop = floatingElemRect.height + targetRect.height + verticalGap * 2

    top += addedToTop
  }

  if (horizontalPosition === 'center') {
    if (left + floatingElemRect.width > editorScrollerRect.right) {
      left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset
    } else if (left < editorScrollerRect.left) {
      left = editorScrollerRect.left + horizontalOffset
    }
  } else {
    if (left + floatingElemRect.width > editorScrollerRect.right) {
      left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset
    }
  }

  left -= anchorElementRect.left

  floatingElem.style.opacity = '1'

  if (specialHandlingForCaret && anchorFlippedOffset !== 0) {
    // Floating select toolbar was flipped (positioned below text rather than above). Thus, the caret now needs to be positioned
    // on the other side and rotated.
    top -= anchorElementRect.bottom - anchorFlippedOffset + floatingElemRect.height - 3
    // top += anchorFlippedOffset - anchorElementRect.height - floatingElemRect.height + 2
    floatingElem.style.transform = `translate(${left}px, ${top}px) rotate(180deg)`
  } else {
    top -= anchorElementRect.top

    floatingElem.style.transform = `translate(${left}px, ${top}px)`
  }

  return addedToTop
}
