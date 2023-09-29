import { useWindowInfo } from '@faceless-ui/window-info'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { usePreferences } from '../../utilities/Preferences'

type NavContextType = {
  navOpen: boolean
  setNavOpen: (value: boolean) => void
}

export const NavContext = React.createContext<NavContextType>({
  navOpen: false,
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
          setNavOpen(preferredState)
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

  return <NavContext.Provider value={{ navOpen, setNavOpen }}>{children}</NavContext.Provider>
}
