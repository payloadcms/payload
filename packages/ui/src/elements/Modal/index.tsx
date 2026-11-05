'use client'

import type { ComponentProps } from 'react'

import { Modal as FacelessModal, useModal } from '@faceless-ui/modal'
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import { useModalFocus } from '../../providers/ModalFocus/index.js'

export { useModal } from '@faceless-ui/modal'

export const Modal: React.FC<ComponentProps<typeof FacelessModal>> = (props) => {
  const {
    id,
    slug,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    focusTrapOptions,
    trapFocus = true,
  } = props
  const modalID = id || slug
  const { modalState } = useModal()
  const isOpen = Boolean(modalState[slug]?.isOpen)
  const popupFocusTargetsRef = useRef<readonly HTMLElement[]>([])
  const { getReturnFocusTargets } = useModalFocus()

  useLayoutEffect(() => {
    if (isOpen) {
      // Freeze each modal's targets before focus moves into it or a nested modal.
      popupFocusTargetsRef.current = getReturnFocusTargets()
    }
  }, [getReturnFocusTargets, isOpen])
  const options = useMemo(
    () => ({
      escapeDeactivates: false,
      initialFocus: () => {
        const modal = document.getElementById(modalID)
        const heading = modal?.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')

        if (heading) {
          heading.tabIndex = -1
        }
        return heading ?? modal
      },
      setReturnFocus: (opener: HTMLElement) =>
        (popupFocusTargetsRef.current.length ? popupFocusTargetsRef.current : [opener]).find(
          (element) =>
            element?.isConnected &&
            element !== document.body &&
            element !== document.documentElement &&
            !element.closest('[inert]') &&
            !element.matches(':disabled') &&
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden',
        ) ?? false,
      ...focusTrapOptions,
    }),
    [modalID, focusTrapOptions],
  )

  useEffect(() => {
    if (!isOpen || ariaLabel || ariaLabelledBy) {
      return
    }

    let hasFocusedTitle = false

    const updateTitle = () => {
      const modal = document.getElementById(modalID)
      const heading = modal?.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')

      if (modal && heading) {
        if (!heading.id) {
          heading.id = `modal-title-${slug}`
        }
        modal.setAttribute('aria-labelledby', heading.id)
        modal.removeAttribute('aria-label')
        if (
          !hasFocusedTitle &&
          trapFocus &&
          focusTrapOptions?.initialFocus === undefined &&
          !modal.closest('[inert]') &&
          (document.activeElement === modal || document.activeElement === document.body)
        ) {
          heading.tabIndex = -1
          heading.focus({ preventScroll: true })
          hasFocusedTitle = document.activeElement === heading
        }
      }
    }

    updateTitle()
    const observer = new MutationObserver(updateTitle)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [isOpen, modalID, slug, ariaLabel, ariaLabelledBy, trapFocus, focusTrapOptions?.initialFocus])

  return (
    <FacelessModal
      {...props}
      data-payload-modal-slug={slug}
      focusTrapOptions={options}
      id={modalID}
      tabIndex={-1}
    />
  )
}
