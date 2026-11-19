'use client'
import { useWindowInfo } from '@faceless-ui/window-info'
import { PREFERENCE_KEYS } from 'payload/shared'
import React, { useEffect, useRef } from 'react'

import { usePreferences } from '../../providers/Preferences/index.js'
import { usePathname } from '../../providers/RouterAdapter/index.js'

type NavContextType = {
  hydrated: boolean
  navOpen: boolean
  navRef: React.RefObject<HTMLDivElement | null>
  navToggleRef?: React.RefObject<HTMLAnchorElement | HTMLButtonElement | null>
  setNavOpen: (value: boolean, persist?: boolean) => void
}

/**
 * @internal
 */
export const NavContext = React.createContext<NavContextType>({
  hydrated: false,
  navOpen: true,
  navRef: null,
  setNavOpen: () => {},
})

export const useNav = () => React.use(NavContext)

const getNavPreference = async (getPreference): Promise<boolean> => {
  const navPrefs = await getPreference(PREFERENCE_KEYS.NAV)
  const preferredState = navPrefs?.open
  if (typeof preferredState === 'boolean') {
    return preferredState
  } else {
    return true
  }
}

/**
 * @internal
 */
export const NavProvider: React.FC<{
  children: React.ReactNode
  initialIsOpen?: boolean
}> = ({ children, initialIsOpen }) => {
  const {
    breakpoints: { m: midBreak, s: smallBreak },
  } = useWindowInfo()

  const pathname = usePathname()

  const { getPreference, setPreference } = usePreferences()
  const navRef = useRef<HTMLDivElement>(null)
  const navToggleRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)
  const shouldReturnFocus = useRef(false)
  const previousBreakpoints = useRef<{ mid?: boolean; small?: boolean }>({})
  const previousPathname = useRef(pathname)

  // The server supplies the saved open state for the initial render.
  const [navOpen, setNavOpenState] = React.useState(initialIsOpen)

  const setNavOpen = React.useCallback(
    (value: boolean, persist = false) => {
      if (!value) {
        const nav = navRef.current?.parentElement

        shouldReturnFocus.current = Boolean(nav?.contains(nav.ownerDocument.activeElement))
      }

      setNavOpenState(value)

      if (persist) {
        void setPreference(PREFERENCE_KEYS.NAV, { open: value }, true)
      }
    },
    [setPreference],
  )

  const [hydrated, setHydrated] = React.useState(false)

  useEffect(() => {
    if (!navOpen && shouldReturnFocus.current) {
      shouldReturnFocus.current = false
      navToggleRef.current?.focus({ preventScroll: true })
    } else if (
      navOpen &&
      navToggleRef.current === navToggleRef.current?.ownerDocument.activeElement &&
      navToggleRef.current?.getClientRects().length === 0
    ) {
      navRef.current?.parentElement
        ?.querySelector<HTMLButtonElement>('.nav__close')
        ?.focus({ preventScroll: true })
    }
  }, [navOpen])

  // on load check the user's preference and set "initial" state
  useEffect(() => {
    let isCancelled = false

    if (midBreak === false) {
      const setNavFromPreferences = async () => {
        const preferredState = await getNavPreference(getPreference)

        if (!isCancelled) {
          setNavOpen(preferredState)
        }
      }

      void setNavFromPreferences()
    }

    return () => {
      isCancelled = true
    }
  }, [midBreak, getPreference, setNavOpen])

  // on smaller screens where the nav is a modal
  // close the nav when the user navigates away
  useEffect(() => {
    if (previousPathname.current !== pathname && smallBreak === true) {
      setNavOpen(false)
    }
    previousPathname.current = pathname
  }, [pathname, setNavOpen, smallBreak])

  // on open and close, lock the body scroll
  // do not do this on desktop, the sidebar is not a modal
  useEffect(() => {
    if (navRef.current) {
      if (navOpen && midBreak) {
        navRef.current.style.overscrollBehavior = 'contain'
      } else {
        navRef.current.style.overscrollBehavior = 'auto'
      }
    }
  }, [navOpen, midBreak])

  // Automatically collapse on tablet/mobile without changing the saved preference.
  useEffect(() => {
    const previous = previousBreakpoints.current

    if (
      (midBreak === true && previous.mid !== true) ||
      (smallBreak === true && previous.small !== true)
    ) {
      setNavOpen(false)
    }

    previousBreakpoints.current = {
      mid: midBreak,
      small: smallBreak,
    }
    if (typeof smallBreak === 'boolean') {
      setHydrated(true)
    }
  }, [midBreak, setNavOpen, smallBreak])

  // when the component unmounts, clear all body scroll locks
  useEffect(() => {
    return () => {
      if (navRef.current) {
        navRef.current.style.overscrollBehavior = 'auto'
      }
    }
  }, [])

  return (
    <NavContext value={{ hydrated, navOpen, navRef, navToggleRef, setNavOpen }}>
      {children}
    </NavContext>
  )
}
