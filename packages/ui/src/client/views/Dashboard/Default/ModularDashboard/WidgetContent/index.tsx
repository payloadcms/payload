'use client'

import type { ReactNode, SyntheticEvent } from 'react'

import { useLayoutEffect, useRef } from 'react'

const focusableSelector =
  'a[href], area[href], button, input, select, textarea, iframe, summary, audio[controls], video[controls], [contenteditable], [tabindex]'

export function WidgetContent({
  id,
  children,
  isEditing,
}: {
  children: ReactNode
  id: string
  isEditing: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const content = ref.current

    if (!isEditing || !content) {
      return
    }

    // Unlike inert, this keeps widget text and structure available to screen readers.
    const tabIndexes = new Map<Element, null | string>()
    const disableTabStops = () => {
      for (const element of content.querySelectorAll(focusableSelector)) {
        if (!tabIndexes.has(element)) {
          tabIndexes.set(element, element.getAttribute('tabindex'))
        }
        if (element.getAttribute('tabindex') !== '-1') {
          element.setAttribute('tabindex', '-1')
        }
      }
    }

    disableTabStops()
    const observer = new MutationObserver(disableTabStops)

    observer.observe(content, {
      attributeFilter: ['tabindex', 'href', 'contenteditable', 'controls'],
      attributes: true,
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      for (const [element, tabIndex] of tabIndexes) {
        if (tabIndex === null) {
          element.removeAttribute('tabindex')
        } else {
          element.setAttribute('tabindex', tabIndex)
        }
      }
    }
  }, [isEditing])

  const preventInteraction = isEditing
    ? (event: SyntheticEvent) => {
        event.preventDefault()
        event.stopPropagation()
      }
    : undefined

  return (
    <div
      aria-disabled={isEditing || undefined}
      className="widget-content"
      id={id}
      onClickCapture={preventInteraction}
      onFocusCapture={
        isEditing
          ? (event) => {
              event.currentTarget.parentElement
                ?.querySelector<HTMLButtonElement>('.widget-wrapper__drag-btn')
                ?.focus()
            }
          : undefined
      }
      onKeyDownCapture={preventInteraction}
      ref={ref}
    >
      {children}
    </div>
  )
}
