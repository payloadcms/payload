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
    breakpoints: { l: largeBreak, m: midBreak, s: smallBreak },
  } = useWindowInfo()

  const pathname = usePathname()

  const { getPreference, setPreference } = usePreferences()
  const navRef = useRef(null)
  const previousBreakpoints = useRef({
    large: largeBreak,
    mid: midBreak,
    small: smallBreak,
  })
  const previousPathname = useRef(pathname)

  // The server supplies the saved open state for the initial render.
  const [navOpen, setNavOpenState] = React.useState(initialIsOpen)

  const setNavOpen = React.useCallback(
    (value: boolean, persist = false) => {
      setNavOpenState(value)

      if (persist) {
        void setPreference(PREFERENCE_KEYS.NAV, { open: value }, true)
      }
    },
    [setPreference],
  )

  const [hydrated, setHydrated] = React.useState(false)

  // on load check the user's preference and set "initial" state
  useEffect(() => {
    if (largeBreak === false) {
      const setNavFromPreferences = async () => {
        const preferredState = await getNavPreference(getPreference)
        setNavOpen(preferredState)
      }

      void setNavFromPreferences()
    }
  }, [largeBreak, getPreference, setNavOpen])

  // on smaller screens where the nav is a modal
  // close the nav when the user navigates away
  useEffect(() => {
    if (previousPathname.current !== pathname && smallBreak === true) {
      setNavOpen(false)
    }
    previousPathname.current = pathname
  }, [pathname, setNavOpen, smallBreak])

  // on smaller screens where the nav is a modal
  // close the nav when the user resizes down to mobile
  // the sidebar is a modal on mobile
  useEffect(() => {
    const previous = previousBreakpoints.current

    if (
      (largeBreak === true && previous.large === false) ||
      (midBreak === true && previous.mid === false) ||
      (smallBreak === true && previous.small !== true)
    ) {
      setNavOpen(false)
    }

    previousBreakpoints.current = {
      large: largeBreak,
      mid: midBreak,
      small: smallBreak,
    }
    if (typeof smallBreak === 'boolean') {
      setHydrated(true)
    }
  }, [largeBreak, midBreak, setNavOpen, smallBreak])

  return <NavContext value={{ hydrated, navOpen, navRef, setNavOpen }}>{children}</NavContext>
}
