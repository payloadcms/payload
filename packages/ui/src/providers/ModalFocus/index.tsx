'use client'

import type { ReactNode } from 'react'

import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef } from 'react'

import { getActiveElement } from '../../utilities/getActiveElement.js'

type PopupRegistration = {
  container: HTMLElement
  getTrigger: () => HTMLElement | null
}

const ModalFocusContext = createContext<{
  getReturnFocusTargets: () => readonly HTMLElement[]
  registerPopup: (registration: PopupRegistration) => () => void
}>({
  getReturnFocusTargets: () => [],
  registerPopup: () => () => {},
})

/** Captures popup ancestors before opening a modal can unmount its trigger. */
export function ModalFocusProvider({ children }: { children: ReactNode }) {
  const targetsRef = useRef<readonly HTMLElement[]>([])
  const popupsRef = useRef(new WeakMap<HTMLElement, PopupRegistration['getTrigger']>())
  const shadowRootsRef = useRef(new Map<ShadowRoot, number>())
  const getReturnFocusTargets = useCallback(() => targetsRef.current, [])
  const rememberPopupTriggers = useCallback((event?: Event) => {
    const target = event?.composedPath()[0] ?? event?.target
    const opener =
      target instanceof Element ? target : getActiveElement({ element: document.documentElement })

    if (!opener || opener === document.body) {
      return
    }

    const targets: HTMLElement[] = []
    let ancestor: Element | null = opener

    while (ancestor) {
      const getTrigger =
        ancestor instanceof HTMLElement ? popupsRef.current.get(ancestor) : undefined

      if (getTrigger) {
        // Pointer activation does not focus buttons in every browser.
        if (!targets.length) {
          const popupOpener = opener.closest<HTMLElement>('button, a[href], [tabindex]')

          if (popupOpener) {
            targets.push(popupOpener)
          }
        }
        const trigger = getTrigger()

        if (trigger && !targets.includes(trigger)) {
          targets.push(trigger)
        }
      }
      const root = ancestor.getRootNode() as Document | ShadowRoot

      ancestor = ancestor.parentElement ?? ('host' in root ? root.host : null)
    }
    targetsRef.current = targets
  }, [])
  const registerPopup = useCallback(
    ({ container, getTrigger }: PopupRegistration) => {
      popupsRef.current.set(container, getTrigger)
      const root = container.getRootNode()

      if (root instanceof ShadowRoot) {
        const count = shadowRootsRef.current.get(root) ?? 0

        if (count === 0) {
          // Focus moves within a shadow root do not reach the document listener.
          root.addEventListener('focusin', rememberPopupTriggers)
        }
        shadowRootsRef.current.set(root, count + 1)
      }

      return () => {
        popupsRef.current.delete(container)

        if (root instanceof ShadowRoot) {
          const count = (shadowRootsRef.current.get(root) ?? 1) - 1

          if (count === 0) {
            root.removeEventListener('focusin', rememberPopupTriggers)
            shadowRootsRef.current.delete(root)
          } else {
            shadowRootsRef.current.set(root, count)
          }
        }
      }
    },
    [rememberPopupTriggers],
  )
  const context = useMemo(
    () => ({ getReturnFocusTargets, registerPopup }),
    [getReturnFocusTargets, registerPopup],
  )

  useLayoutEffect(() => {
    rememberPopupTriggers()
    document.addEventListener('focusin', rememberPopupTriggers)
    document.addEventListener('pointerdown', rememberPopupTriggers, true)
    // Keyboard activation can follow focus changes hidden by nested shadow roots.
    document.addEventListener('click', rememberPopupTriggers, true)
    return () => {
      document.removeEventListener('focusin', rememberPopupTriggers)
      document.removeEventListener('pointerdown', rememberPopupTriggers, true)
      document.removeEventListener('click', rememberPopupTriggers, true)
    }
  }, [rememberPopupTriggers])

  return <ModalFocusContext value={context}>{children}</ModalFocusContext>
}

export const useModalFocus = () => use(ModalFocusContext)
