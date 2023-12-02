/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const VERTICAL_GAP = 10
const HORIZONTAL_OFFSET = 5

// TODO: This works fine with some dirty fixes (looking at you, specialHandlingForCaret). But this definitely needs refactoring and documentation, to be easier to understand and maintain.
// This is supposed to position the floatingElem based on the parent (anchorElem) and the target (targetRect) which is usually the selected text.
// So basically, it positions the floatingElem either below or above the target (targetRect) and aligns it to the left or center of the target (targetRect).
export function setFloatingElemPosition(
  targetRect: ClientRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  horizontalPosition: 'center' | 'left' = 'left',
  verticalGap: number = VERTICAL_GAP,
  horizontalOffset: number = HORIZONTAL_OFFSET,
  specialHandlingForCaret = false,
): void {
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

  if (top < editorScrollerRect.top) {
    top += floatingElemRect.height + targetRect.height + verticalGap * 2
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

  top -= anchorElementRect.top
  left -= anchorElementRect.left

  floatingElem.style.opacity = '1'

  if (specialHandlingForCaret && top == 0 /* 0 Happens when selecting 1st line */) {
    top -= 44 // Especially this arbitrary number needs refactoring (this is for the caret)
    // rotate too
    floatingElem.style.transform = `translate(${left}px, ${top}px) rotate(180deg)`
  } else if (
    specialHandlingForCaret &&
    top === -63 /* -63 Happens when selecting 2nd line in multi-line paragraph */
  ) {
    top += 18 // Especially this arbitrary number needs refactoring (this is for the caret)
    floatingElem.style.transform = `translate(${left}px, ${top}px) rotate(180deg)`
  } else {
    floatingElem.style.transform = `translate(${left}px, ${top}px)`
  }
}
