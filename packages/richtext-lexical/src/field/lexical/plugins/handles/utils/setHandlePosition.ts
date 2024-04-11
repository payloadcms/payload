import { doesLineHeightAffectElement } from './doesLineHeightAffectElement'

export function setHandlePosition(
  targetElem: HTMLElement | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  leftOffset: number = 0, // SPACE
) {
  if (!targetElem) {
    floatingElem.style.opacity = '0'
    floatingElem.style.transform = 'translate(-10000px, -10000px)'
    return
  }

  const targetRect = targetElem.getBoundingClientRect()
  const targetStyle = window.getComputedStyle(targetElem)
  const floatingElemRect = floatingElem.getBoundingClientRect()
  const anchorElementRect = anchorElem.getBoundingClientRect()

  // No need to let line height affect the re-positioning of the floating element if line height has no
  // visual effect on the element. Otherwise, the floating element will be positioned incorrectly.
  const actualLineHeight = doesLineHeightAffectElement(targetElem)
    ? parseInt(targetStyle.lineHeight, 10)
    : 0

  const top =
    targetRect.top + (actualLineHeight - floatingElemRect.height) / 2 - anchorElementRect.top

  const left = leftOffset

  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${left}px, ${top}px)`
}
