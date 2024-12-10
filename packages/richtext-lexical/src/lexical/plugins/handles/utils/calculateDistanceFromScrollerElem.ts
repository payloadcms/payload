'use client'
/**
 * Calculate distance between scrollerElem and target if target is not in scrollerElem
 */
export const calculateDistanceFromScrollerElem = (
  scrollerElem: HTMLElement | null,
  pageX: number,
  pageY: number,
  target: HTMLElement,
  horizontalBuffer: number = 50,
  verticalBuffer: number = 25,
): number => {
  let distanceFromScrollerElem = 0
  if (scrollerElem && !scrollerElem.contains(target)) {
    const { bottom, left, right, top } = scrollerElem.getBoundingClientRect()

    const adjustedTop = top + window.scrollY
    const adjustedBottom = bottom + window.scrollY

    if (
      pageY < adjustedTop - verticalBuffer ||
      pageY > adjustedBottom + verticalBuffer ||
      pageX < left - horizontalBuffer ||
      pageX > right + horizontalBuffer
    ) {
      return -1
    }

    // This is used to allow the _draggableBlockElem to be found when the mouse is in the
    // buffer zone around the scrollerElem.
    if (pageX < left || pageX > right) {
      distanceFromScrollerElem = pageX < left ? pageX - left : pageX - right
    }
  }
  return distanceFromScrollerElem
}
