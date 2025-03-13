'use client'
import { useWindowInfo } from '@faceless-ui/window-info'
import { usePathname } from 'next/navigation.js'
import React, { useEffect, useRef } from 'react'

import { usePreferences } from '../../providers/Preferences/index.js'

type NavContextType = {
  hydrated: boolean
  navOpen: boolean
  navRef: React.RefObject<HTMLDivElement | null>
  setNavOpen: (value: boolean) => void
  shouldAnimate: boolean
}

export const NavContext = React.createContext<NavContextType>({
  hydrated: false,
  navOpen: true,
  navRef: null,
  setNavOpen: () => {},
  shouldAnimate: false,
})

export const useNav = () => React.use(NavContext)

const getNavPreference = async (getPreference): Promise<boolean> => {
  const navPrefs = await getPreference('nav')
  const preferredState = navPrefs?.open
  if (typeof preferredState === 'boolean') {
    return preferredState
  } else {
    return true
  }
}

export const NavProvider: React.FC<{
  children: React.ReactNode
  initialIsOpen?: boolean
}> = ({ children, initialIsOpen }) => {
  const {
    breakpoints: { l: largeBreak, m: midBreak, s: smallBreak },
  } = useWindowInfo()

  const pathname = usePathname()

  const { getPreference } = usePreferences()
  const navRef = useRef(null)

  // initialize the nav to be closed
  // this is because getting the preference is async
  // so instead of closing it after the preference is loaded
  // we will open it after the preference is loaded
  const [navOpen, setNavOpen] = React.useState(initialIsOpen)

  const [shouldAnimate, setShouldAnimate] = React.useState(false)
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

  // on smaller screens where the nav is a modal
  // close the nav when the user resizes down to mobile
  // the sidebar is a modal on mobile
  useEffect(() => {
    if (largeBreak === true || midBreak === true || smallBreak === true) {
      setNavOpen(false)
    }
    setHydrated(true)

    setTimeout(() => {
      setShouldAnimate(true)
    }, 100)
  }, [largeBreak, midBreak, smallBreak])

  // when the component unmounts, clear all body scroll locks
  useEffect(() => {
    return () => {
      if (navRef.current) {
        navRef.current.style.overscrollBehavior = 'auto'
      }
    }
  }, [])

  return (
    <NavContext value={{ hydrated, navOpen, navRef, setNavOpen, shouldAnimate }}>
      {children}
    </NavContext>
  )
}
