'use client';

const VERTICAL_GAP = 10;
const HORIZONTAL_OFFSET = 5;
export function setFloatingElemPositionForLinkEditor(targetRect, floatingElem, anchorElem, verticalGap = VERTICAL_GAP, horizontalOffset = HORIZONTAL_OFFSET) {
  const scrollerElem = anchorElem.parentElement;
  if (targetRect === null || scrollerElem == null) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }
  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();
  let top = targetRect.top - verticalGap;
  let left = targetRect.left - horizontalOffset;
  if (top < editorScrollerRect.top) {
    top += floatingElemRect.height + targetRect.height + verticalGap * 2;
  }
  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
  }
  top -= anchorElementRect.top;
  left -= anchorElementRect.left;
  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
//# sourceMappingURL=setFloatingElemPositionForLinkEditor.js.map