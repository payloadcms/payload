'use client'

import type { ReactNode } from 'react'

import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef } from 'react'

import { getActiveElement } from '../../utilities/getActiveElement.js'
import { getComposedParent } from '../../utilities/shadowDom.js'

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
  const getReturnFocusTargets = useCallback(() => targetsRef.current, [])
  const registerPopup = useCallback(({ container, getTrigger }: PopupRegistration) => {
    popupsRef.current.set(container, getTrigger)
    return () => {
      popupsRef.current.delete(container)
    }
  }, [])
  const context = useMemo(
    () => ({ getReturnFocusTargets, registerPopup }),
    [getReturnFocusTargets, registerPopup],
  )

  useLayoutEffect(() => {
    const shadowRoots = new Set<ShadowRoot>()
    const rememberPopupTriggers = (event?: Event) => {
      const target = event?.composedPath()[0]
      const opener =
        target instanceof Element ? target : getActiveElement({ element: document.documentElement })

      if (!opener || opener === document.body) {
        for (const root of shadowRoots) {
          root.removeEventListener('focusin', rememberPopupTriggers)
        }
        shadowRoots.clear()
        targetsRef.current = []
        return
      }

      const targets: HTMLElement[] = []
      const controlSelector = 'button, a[href], input, select, textarea, [tabindex]'
      const openerControl =
        event
          ?.composedPath()
          .find(
            (node): node is HTMLElement =>
              node instanceof HTMLElement && node.matches(controlSelector),
          ) ?? opener.closest<HTMLElement>(controlSelector)

      if (opener.getRootNode() instanceof ShadowRoot && openerControl) {
        targets.push(openerControl)
      }

      let ancestor: Element | null = opener
      const currentRoots = new Set<ShadowRoot>()

      while (ancestor) {
        const root = ancestor.getRootNode()

        if (root instanceof ShadowRoot) {
          currentRoots.add(root)
          if (!shadowRoots.has(root)) {
            shadowRoots.add(root)
            // Focus moves within a shadow tree do not always reach document listeners.
            root.addEventListener('focusin', rememberPopupTriggers)
          }
        }

        const getTrigger =
          ancestor instanceof HTMLElement ? popupsRef.current.get(ancestor) : undefined

        if (getTrigger) {
          // Pointer activation does not focus buttons in every browser.
          if (!targets.length) {
            if (openerControl) {
              targets.push(openerControl)
            }
          }
          const trigger = getTrigger()

          if (trigger && !targets.includes(trigger)) {
            targets.push(trigger)
          }
        }
        ancestor = getComposedParent({ element: ancestor })
      }

      for (const root of shadowRoots) {
        if (!currentRoots.has(root)) {
          root.removeEventListener('focusin', rememberPopupTriggers)
          shadowRoots.delete(root)
        }
      }

      targetsRef.current = targets
    }

    rememberPopupTriggers()
    document.addEventListener('focusin', rememberPopupTriggers)
    document.addEventListener('pointerdown', rememberPopupTriggers, true)
    // Keyboard activation can follow focus changes hidden by nested shadow roots.
    document.addEventListener('click', rememberPopupTriggers, true)
    return () => {
      document.removeEventListener('focusin', rememberPopupTriggers)
      document.removeEventListener('pointerdown', rememberPopupTriggers, true)
      document.removeEventListener('click', rememberPopupTriggers, true)
      for (const root of shadowRoots) {
        root.removeEventListener('focusin', rememberPopupTriggers)
      }
    }
  }, [])

  return <ModalFocusContext value={context}>{children}</ModalFocusContext>
}

export const useModalFocus = () => use(ModalFocusContext)
