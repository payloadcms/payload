import type { RefObject } from 'react'

import { useEffect } from 'react'

import type { EditViewAlignment, EditViewWidth } from '../../providers/Theme/shared.js'

const fullWidthAttribute = 'data-edit-view-full-width'

export const useEditViewWidth = ({
  editViewAlignment,
  editViewWidth,
  ref,
}: {
  editViewAlignment: EditViewAlignment
  editViewWidth: EditViewWidth
  ref: RefObject<HTMLDivElement | null>
}): void => {
  useEffect(() => {
    const main = ref.current
    const documentFields = main?.querySelector<HTMLElement>(':scope > .document-fields')
    const mainFields = main?.querySelector<HTMLElement>(
      ':scope > .document-fields > .document-fields__main > .document-fields__edit',
    )
    const widthTarget = editViewAlignment === 'center-all' ? documentFields : mainFields
    const widthContainer = editViewAlignment === 'center-all' ? main : mainFields?.parentElement

    if (!main || !widthTarget || !widthContainer) {
      return
    }

    const updateWidth = () => {
      const availableWidth = widthContainer.getBoundingClientRect().width

      main.removeAttribute(fullWidthAttribute)
      const constrainedWidth = widthTarget.getBoundingClientRect().width
      const shouldFill = editViewWidth === 'full' || availableWidth - constrainedWidth <= 128

      main.toggleAttribute(fullWidthAttribute, shouldFill)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    const mutationObserver = new MutationObserver(updateWidth)

    observer.observe(widthContainer)
    observer.observe(widthTarget)
    // Conditional fields and permissions can change sidebar presence without resizing the pane.
    mutationObserver.observe(widthTarget, {
      attributeFilter: ['class', 'hidden'],
      attributes: true,
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      main.removeAttribute(fullWidthAttribute)
    }
  }, [editViewAlignment, editViewWidth, ref])
}
