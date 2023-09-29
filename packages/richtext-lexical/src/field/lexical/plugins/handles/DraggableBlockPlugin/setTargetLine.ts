import { getCollapsedMargins } from '../utils/getCollapsedMargins'
import { getBoundingClientRectWithoutTransform } from './getBoundingRectWithoutTransform'
import { highlightElemOriginalPosition } from './highlightElemOriginalPosition'
const TARGET_LINE_HALF_HEIGHT = 25
const TEXT_BOX_HORIZONTAL_PADDING = -24
const DEBUG = false

export function setTargetLine(
  SPACE: number,
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  lastTargetBlockElem: HTMLElement | null,
  mouseY: number,
  anchorElem: HTMLElement,
  event: DragEvent,
  debugHighlightRef: React.RefObject<HTMLDivElement>,
  isFoundNodeEmptyParagraph: boolean = false,
) {
  const { height: targetBlockElemHeight, top: targetBlockElemTop } =
    getBoundingClientRectWithoutTransform(targetBlockElem)
  const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect()

  const { marginBottom, marginTop } = getCollapsedMargins(targetBlockElem)
  let lineTop = targetBlockElemTop

  const isBelow = mouseY >= targetBlockElemTop + targetBlockElemHeight / 2 + window.scrollY
  if (!isFoundNodeEmptyParagraph) {
    if (isBelow) {
      // below targetBlockElem
      lineTop += targetBlockElemHeight + marginBottom / 2
    } else {
      // above targetBlockElem
      lineTop -= marginTop / 2
    }
  } else {
    lineTop += targetBlockElemHeight / 2
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2}px`
  targetLineElem.style.opacity = '.4'

  targetBlockElem.style.opacity = '0.4'
  if (!isFoundNodeEmptyParagraph) {
    // move lastTargetBlockElem down 50px to make space for targetLineElem (which is 50px height)
    if (isBelow) {
      targetBlockElem.style.transform = `translate(0, ${-TARGET_LINE_HALF_HEIGHT / 1.9}px)`
    } else {
      targetBlockElem.style.transform = `translate(0, ${TARGET_LINE_HALF_HEIGHT / 1.9}px)`
    }
  }

  if (DEBUG) {
    //targetBlockElem.style.border = '3px solid red'
    highlightElemOriginalPosition(debugHighlightRef, targetBlockElem, anchorElem)
  }

  if (lastTargetBlockElem && lastTargetBlockElem !== targetBlockElem) {
    lastTargetBlockElem.style.opacity = '1'
    lastTargetBlockElem.style.transform = 'translate(0, 0)'
    //lastTargetBlockElem.style.border = 'none'
  }
}
