'use client'
import React from 'react'
import { useNav } from './context'

export const NavHamburger: React.FC<{
  baseClass?: string
}> = ({ baseClass }) => {
  const { navOpen, setNavOpen } = useNav()

  return (
    <button
      className={`${baseClass}__mobile-close`}
      onClick={() => {
        setNavOpen(false)
      }}
      tabIndex={!navOpen ? -1 : undefined}
      type="button"
    >
      <span>hamburger</span>
    </button>
  )
}

export const NavWrapper: React.FC<{
  baseClass?: string
  children: React.ReactNode
}> = (props) => {
  const { baseClass, children } = props

  const { hydrated, navOpen, navRef, shouldAnimate } = useNav()

  return (
    <aside
      className={[
        baseClass,
        navOpen && `${baseClass}--nav-open`,
        shouldAnimate && `${baseClass}--nav-animate`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
      inert={!navOpen ? true : undefined}
    >
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}

export const AfterNavLinks = () => {
  return (
    <div
      className={'dd'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <h4 className="nav__label" style={{ color: 'var(--theme-elevation-400)', margin: 0 }}>
        Custom Routes
      </h4>
      <div id="custom-css" />
    </div>
  )
}
