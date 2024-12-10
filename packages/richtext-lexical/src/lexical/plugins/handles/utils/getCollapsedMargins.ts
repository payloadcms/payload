'use client'
export function getCollapsedMargins(elem: HTMLElement): {
  marginBottom: number
  marginTop: number
} {
  const getMargin = (element: Element | null, margin: 'marginBottom' | 'marginTop'): number =>
    element ? parseFloat(window.getComputedStyle(element)[margin]) : 0

  const { marginBottom, marginTop } = window.getComputedStyle(elem)
  const prevElemSiblingMarginBottom = getMargin(elem.previousElementSibling, 'marginBottom')
  const nextElemSiblingMarginTop = getMargin(elem.nextElementSibling, 'marginTop')
  const collapsedTopMargin = Math.max(parseFloat(marginTop), prevElemSiblingMarginBottom)
  const collapsedBottomMargin = Math.max(parseFloat(marginBottom), nextElemSiblingMarginTop)

  return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin }
}
