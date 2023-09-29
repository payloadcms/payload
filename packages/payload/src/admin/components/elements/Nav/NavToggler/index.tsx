import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNav } from '../context'
import { NavIcon } from '../NavIcon'
import { usePreferences } from '../../../utilities/Preferences'

import './index.scss'

const baseClass = 'nav-toggler'

export const NavToggler: React.FC = () => {
  const { t } = useTranslation('general')

  const { setPreference } = usePreferences()

  const { navOpen, setNavOpen } = useNav()

  return (
    <button
      type="button"
      className={baseClass}
      aria-label={t('menu')}
      onClick={async () => {
        // only when the user explicitly toggles the nav do we want to set the preference
        // this is because the js may open or close the nav based on the window size, routing, etc
        await setPreference('nav', {
          open: !navOpen,
        })
        setNavOpen(!navOpen)
      }}
    >
      <NavIcon isActive={navOpen} />
    </button>
  )
}
