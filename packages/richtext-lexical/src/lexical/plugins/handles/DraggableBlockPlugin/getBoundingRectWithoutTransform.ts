'use client'
export function getBoundingClientRectWithoutTransform(elem: HTMLElement): DOMRect {
  const rect = elem.getBoundingClientRect()

  // Extract the translation value from the transform style
  const transformValue = getComputedStyle(elem).getPropertyValue('transform')
  if (!transformValue || transformValue === 'none') {
    return rect
  }

  const lastNumberOfTransformValue = transformValue.split(',').pop()
  rect.y = rect.y - Number(lastNumberOfTransformValue?.replace(')', ''))

  // Return the original bounding rect if no translation is applied
  return rect
}
