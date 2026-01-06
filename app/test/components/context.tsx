'use client'
import React, { useRef } from 'react'

type NavContextType = {
  hydrated: boolean
  navOpen: boolean
  navRef: React.RefObject<HTMLDivElement | null>
  setNavOpen: (value: boolean) => void
  shouldAnimate: boolean
}

/**
 * @internal
 */
export const NavContext = React.createContext<NavContextType>({
  hydrated: false,
  navOpen: true,
  navRef: null,
  setNavOpen: () => {},
  shouldAnimate: false,
})

export const useNav = () => React.use(NavContext)

/**
 * @internal
 */
export const NavProvider: React.FC<{
  children: React.ReactNode
  initialIsOpen?: boolean
}> = ({ children, initialIsOpen }) => {
  const navRef = useRef(null)

  // initialize the nav to be closed
  // this is because getting the preference is async
  // so instead of closing it after the preference is loaded
  // we will open it after the preference is loaded
  const [navOpen, setNavOpen] = React.useState(initialIsOpen)

  return (
    <NavContext value={{ hydrated: true, navOpen, navRef, setNavOpen, shouldAnimate: true }}>
      {children}
    </NavContext>
  )
}
