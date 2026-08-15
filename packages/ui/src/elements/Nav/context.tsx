'use client'
import { useWindowInfo } from '@faceless-ui/window-info'
import { PREFERENCE_KEYS } from 'payload/shared'
import React, { useEffect } from 'react'

import { usePreferences } from '../../providers/Preferences/index.js'
import { usePathname } from '../../providers/RouterAdapter/index.js'

type NavContextType = {
  hydrated: boolean
  navOpen: boolean
  setNavOpen: (value: boolean) => void
}

/**
 * @internal
 */
export const NavContext = React.createContext<NavContextType>({
  hydrated: false,
  navOpen: true,
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

  const { getPreference } = usePreferences()

  // initialize the nav to be closed
  // this is because getting the preference is async
  // so instead of closing it after the preference is loaded
  // we will open it after the preference is loaded
  const [navOpen, setNavOpen] = React.useState(initialIsOpen)

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
    if (smallBreak === true) {
      setNavOpen(false)
    }
  }, [pathname])

  // on smaller screens where the nav is a modal
  // close the nav when the user resizes down to mobile
  // the sidebar is a modal on mobile
  useEffect(() => {
    if (largeBreak === true || midBreak === true || smallBreak === true) {
      setNavOpen(false)
    }
    setHydrated(true)
  }, [largeBreak, midBreak, smallBreak])

  return <NavContext value={{ hydrated, navOpen, setNavOpen }}>{children}</NavContext>
}
