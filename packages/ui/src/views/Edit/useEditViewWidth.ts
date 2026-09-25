import type { RefObject } from 'react'

import { useEffect } from 'react'

import type { EditViewWidth } from '../../providers/Theme/shared.js'

const fullWidthAttribute = 'data-edit-view-full-width'
const contentWidthProperty = '--edit-view-content-width'

export const useEditViewWidth = ({
  editViewWidth,
  ref,
  shouldAlignHeader = false,
}: {
  editViewWidth: EditViewWidth
  ref: RefObject<HTMLDivElement | null>
  shouldAlignHeader?: boolean
}): void => {
  useEffect(() => {
    const main = ref.current
    const fields = main?.querySelector<HTMLElement>(':scope > .document-fields')

    if (!main || !fields) {
      return
    }

    const editView = main.closest('.collection-edit')
    const header = editView?.parentElement?.querySelector<HTMLElement>(':scope > .doc-header')
    const controls = main
      .closest('.collection-edit__form')
      ?.querySelector<HTMLElement>(':scope > .doc-controls')
    const bars = shouldAlignHeader
      ? [header, controls].filter((element): element is HTMLElement => Boolean(element))
      : []

    const updateWidth = () => {
      const mainWidth = main.getBoundingClientRect().width

      // Measure the constrained form, including its actual sidebar and gutters.
      // Remove the override first so a filled form can become constrained again.
      main.removeAttribute(fullWidthAttribute)
      const constrainedWidth = fields.getBoundingClientRect().width
      const shouldFill = editViewWidth === 'full' || mainWidth - constrainedWidth <= 128

      main.toggleAttribute(fullWidthAttribute, shouldFill)

      const contentWidth = shouldFill ? mainWidth : constrainedWidth

      for (const bar of bars) {
        bar.style.setProperty(contentWidthProperty, `${contentWidth}px`)
        bar.setAttribute('data-edit-view-aligned', '')
      }
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    const mutationObserver = new MutationObserver(updateWidth)

    observer.observe(main)
    observer.observe(fields)
    // Conditional fields and permissions can change sidebar presence without resizing the pane.
    mutationObserver.observe(fields, {
      attributeFilter: ['class', 'hidden'],
      attributes: true,
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      for (const bar of bars) {
        bar.style.removeProperty(contentWidthProperty)
        bar.removeAttribute('data-edit-view-aligned')
      }
      main.removeAttribute(fullWidthAttribute)
    }
  }, [editViewWidth, ref, shouldAlignHeader])
}
