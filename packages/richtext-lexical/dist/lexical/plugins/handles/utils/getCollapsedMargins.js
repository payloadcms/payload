'use client';

export function getCollapsedMargins(elem) {
  const getMargin = (element, margin) => element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;
  const {
    marginBottom,
    marginTop
  } = window.getComputedStyle(elem);
  const prevElemSiblingMarginBottom = getMargin(elem.previousElementSibling, 'marginBottom');
  const nextElemSiblingMarginTop = getMargin(elem.nextElementSibling, 'marginTop');
  const collapsedTopMargin = Math.max(parseFloat(marginTop), prevElemSiblingMarginBottom);
  const collapsedBottomMargin = Math.max(parseFloat(marginBottom), nextElemSiblingMarginTop);
  return {
    marginBottom: collapsedBottomMargin,
    marginTop: collapsedTopMargin
  };
}
//# sourceMappingURL=getCollapsedMargins.js.map