'use client'

import type { ReactNode } from 'react'

import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef } from 'react'

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
    const rememberPopupTriggers = (event?: Event) => {
      const opener = event?.target instanceof Element ? event.target : document.activeElement

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
        ancestor = ancestor.parentElement
      }
      targetsRef.current = targets
    }

    rememberPopupTriggers()
    document.addEventListener('focusin', rememberPopupTriggers)
    document.addEventListener('pointerdown', rememberPopupTriggers, true)
    return () => {
      document.removeEventListener('focusin', rememberPopupTriggers)
      document.removeEventListener('pointerdown', rememberPopupTriggers, true)
    }
  }, [])

  return <ModalFocusContext value={context}>{children}</ModalFocusContext>
}

export const useModalFocus = () => use(ModalFocusContext)
