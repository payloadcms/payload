'use client'

import { useModal } from '@faceless-ui/modal'
import { useEffect } from 'react'

import { getActiveModal } from '../../utilities/getActiveModal.js'
import { getComposedParent, getRootNode } from '../../utilities/shadowDom.js'

/** Keeps the page and lower modal layers out of navigation while the top modal is open. */
export function ModalAccessibility() {
  const { containerRef, modalState } = useModal()

  useEffect(() => {
    if (!Object.values(modalState).some((modal) => modal.isOpen)) {
      return
    }

    const restoredInert = new Map<HTMLElement, BackgroundState>()
    const observedRoots = new Set<Document | ShadowRoot>()
    const observer = new MutationObserver(() => update())
    const observeRoot = ({ root }: { root: Document | ShadowRoot }) => {
      if (observedRoots.has(root)) {
        return
      }

      observedRoots.add(root)
      root.addEventListener('slotchange', update)
      observer.observe(root instanceof Document ? root.body : root, {
        attributeFilter: ['open', 'slot'],
        attributes: true,
        childList: true,
        subtree: true,
      })
    }

    const restore = () => {
      for (const [element, wasInert] of restoredInert) {
        restoreBackgroundElement({ element, state: wasInert })
      }
      restoredInert.clear()
    }

    const update = () => {
      const root = getRootNode({ element: containerRef.current })
      const activeModal = getActiveModal({ modalState, root })

      observeRoot({ root })

      const background = new Set<HTMLElement>()
      let current: Element | null | undefined = activeModal

      while (current && current !== document.body) {
        observeRoot({ root: getRootNode({ element: current }) })

        const parent = getComposedParent({ element: current })
        const siblings = current.assignedSlot
          ? current.assignedSlot.assignedElements()
          : current.parentNode?.children

        for (const sibling of siblings ?? []) {
          if (sibling !== current && sibling instanceof HTMLElement) {
            background.add(sibling)
          }
        }
        current = parent
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
            inert: element.getAttribute('inert'),
          })
          element.inert = true
          element.setAttribute('aria-hidden', 'true')
        }
      }
    }

    update()

    return () => {
      observer.disconnect()
      for (const root of observedRoots) {
        root.removeEventListener('slotchange', update)
      }
      restore()
    }
  }, [containerRef, modalState])

  return null
}

type BackgroundState = { ariaHidden: null | string; inert: null | string }

function restoreBackgroundElement({
  element,
  state,
}: {
  element: HTMLElement
  state: BackgroundState
}) {
  if (state.inert === null) {
    element.removeAttribute('inert')
  } else {
    element.setAttribute('inert', state.inert)
  }
  if (state.ariaHidden === null) {
    element.removeAttribute('aria-hidden')
  } else {
    element.setAttribute('aria-hidden', state.ariaHidden)
  }
}
