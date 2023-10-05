import { useWindowInfo } from '@faceless-ui/window-info'
import { clearAllBodyScrollLocks, disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import React, { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'

import { usePreferences } from '../../utilities/Preferences'

type NavContextType = {
  navOpen: boolean
  navRef: React.RefObject<HTMLDivElement>
  setNavOpen: (value: boolean) => void
}

export const NavContext = React.createContext<NavContextType>({
  navOpen: true,
  navRef: null,
  setNavOpen: () => {},
})

export const useNav = () => React.useContext(NavContext)

export const NavProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const {
    breakpoints: { l: largeBreak },
  } = useWindowInfo()

  const { getPreference } = usePreferences()
  const history = useHistory()
  const navRef = useRef(null)

  // initialize the nav to be closed
  // this is because getting the preference is async
  // so instead of closing it after the preference is loaded
  // we will open it after the preference is loaded
  const [navOpen, setNavOpen] = React.useState(false)

  // on load check the user's preference and set "initial" state
  useEffect(() => {
    if (largeBreak === false) {
      const setNavFromPreferences = async () => {
        const navPrefs = await getPreference('nav')
        const preferredState = navPrefs?.open
        if (typeof preferredState === 'boolean') {
          console.log({ navPrefs })
          setNavOpen(preferredState)
        } else {
          setNavOpen(true)
        }
      }

      setNavFromPreferences()
    }
  }, [largeBreak, getPreference, setNavOpen])

  // on smaller screens where the nav is a modal
  // close the nav when the user navigates away
  useEffect(() => {
    let unlisten: () => void

    if (largeBreak) {
      unlisten = history.listen(() => {
        setNavOpen(false)
      })
    } else if (unlisten) {
      unlisten()
    }

    return () => unlisten && unlisten()
  }, [history, setNavOpen, largeBreak])

  // on smaller screens where the nav is a modal
  // close the nav when the user resizes down to a smaller screen
  useEffect(() => {
    if (largeBreak) {
      setNavOpen(false)
    }
  }, [largeBreak])

  // on open and close, lock the body scroll
  // do not do this on desktop, the sidebar is not a modal
  useEffect(() => {
    if (navRef.current) {
      if (navOpen && largeBreak) {
        disableBodyScroll(navRef.current)
      } else {
        enableBodyScroll(navRef.current)
      }
    }
  }, [navOpen, largeBreak])

  // when the component unmounts, clear all body scroll locks
  useEffect(() => {
    return () => {
      clearAllBodyScrollLocks()
    }
  }, [])

  return (
    <NavContext.Provider value={{ navOpen, navRef, setNavOpen }}>{children}</NavContext.Provider>
  )
}
