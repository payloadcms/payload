'use client'
export function isOnHandleElement(element: HTMLElement, handleElementClassName: string): boolean {
  return !!element.closest(`.${handleElementClassName}`)
}
