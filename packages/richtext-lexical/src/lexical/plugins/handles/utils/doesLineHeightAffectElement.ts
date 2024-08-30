'use client'
const replacedElements = [
  'IMG',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
  'VIDEO',
  'OBJECT',
  'EMBED',
  'IFRAME',
  'HR',
]

/**
 * From ChatGPT, only that verified it works for HR elements.
 *
 * HTML Elements can have CSS lineHeight applied to them, but it doesn't always affect the visual layout.
 * This function checks if the line-height property has an effect on the element's layout.
 * @param htmlElem
 */
export function doesLineHeightAffectElement(htmlElem: HTMLElement) {
  if (!htmlElem) {
    return false
  }

  // Check for replaced elements, elements that typically don't support line-height adjustments,
  // and elements without visible content

  if (
    replacedElements.includes(htmlElem.tagName) ||
    htmlElem.offsetHeight === 0 ||
    htmlElem.offsetWidth === 0
  ) {
    return false
  }

  // Check for specific CSS properties that negate line-height's visual effects
  const style = window.getComputedStyle(htmlElem)
  if (
    style.display === 'table-cell' ||
    style.position === 'absolute' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false
  }

  // This is a basic check, and there can be more complex scenarios where line-height doesn't have an effect.
  return true
}
