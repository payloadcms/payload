'use client'

import { useModal } from '@faceless-ui/modal'
import { useLayoutEffect } from 'react'

import { getActiveModal } from '../../utilities/getActiveModal.js'

/** Keeps the page and lower modal layers out of navigation while the top modal is open. */
export function ModalAccessibility() {
  const { modalState } = useModal()

  useLayoutEffect(() => {
    if (!Object.values(modalState).some((modal) => modal.isOpen)) {
      return
    }

    const restoredInert = new Map<HTMLElement, BackgroundState>()

    const restore = () => {
      for (const [element, wasInert] of restoredInert) {
        restoreBackgroundElement({ element, state: wasInert })
      }
      restoredInert.clear()
    }

    const update = () => {
      const activeModal = getActiveModal({ modalState })

      const background = new Set<HTMLElement>()
      let current = activeModal

      while (current && current !== document.body) {
        for (const sibling of current.parentElement?.children ?? []) {
          if (sibling !== current && sibling instanceof HTMLElement) {
            background.add(sibling)
          }
        }
        current = current.parentElement
      }

      for (const [element, wasInert] of restoredInert) {
        if (!background.has(element)) {
          restoreBackgroundElement({ element, state: wasInert })
          restoredInert.delete(element)
        }
      }
      for (const element of background) {
        if (!restoredInert.has(element)) {
          restoredInert.set(element, {
            ariaHidden: element.getAttribute('aria-hidden'),
            inert: element.inert,
          })
          element.inert = true
          element.setAttribute('aria-hidden', 'true')
        }
      }
    }

    update()
    // Drawers render asynchronously; also isolate siblings inserted after opening.
    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      attributeFilter: ['open'],
      attributes: true,
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      restore()
    }
  }, [modalState])

  return null
}

type BackgroundState = { ariaHidden: null | string; inert: boolean }

function restoreBackgroundElement({
  element,
  state,
}: {
  element: HTMLElement
  state: BackgroundState
}) {
  element.inert = state.inert
  if (state.ariaHidden === null) {
    element.removeAttribute('aria-hidden')
  } else {
    element.setAttribute('aria-hidden', state.ariaHidden)
  }
}
