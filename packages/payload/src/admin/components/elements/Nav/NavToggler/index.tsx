import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNav } from '../context'
import { NavIcon } from '../NavIcon'
import { usePreferences } from '../../../utilities/Preferences'

import './index.scss'
import { useWindowInfo } from '@faceless-ui/window-info'

const baseClass = 'nav-toggler'

export const NavToggler: React.FC<{
  className?: string
  id?: string
  children?: React.ReactNode
}> = (props) => {
  const { className, id, children } = props

  const { t } = useTranslation('general')

  const { setPreference } = usePreferences()

  const { navOpen, setNavOpen } = useNav()

  const {
    breakpoints: { l: largeBreak },
  } = useWindowInfo()

  return (
    <button
      type="button"
      className={[baseClass, className].filter(Boolean).join(' ')}
      aria-label={t('menu')}
      id={id}
      onClick={async () => {
        setNavOpen(!navOpen)

        // only when the user explicitly toggles the nav on desktop do we want to set the preference
        // this is because the js may open or close the nav based on the window size, routing, etc
        if (!largeBreak) {
          await setPreference('nav', {
            open: !navOpen,
          })
        }
      }}
    >
      {children}
    </button>
  )
}
