import React, { useEffect, useState } from 'react'
import AnimateHeight from 'react-animate-height'

import Chevron from '../../icons/Chevron'
import { usePreferences } from '../../utilities/Preferences'
import { useNav } from '../Nav/context'
import './index.scss'

const baseClass = 'nav-group'

type Props = {
  children: React.ReactNode
  label: string
}

const NavGroup: React.FC<Props> = ({ children, label }) => {
  const [collapsed, setCollapsed] = useState(true)
  const [animate, setAnimate] = useState(false)
  const { getPreference, setPreference } = usePreferences()
  const { navOpen } = useNav()

  const preferencesKey = `collapsed-${label}-groups`

  useEffect(() => {
    if (label) {
      const setCollapsedFromPreferences = async () => {
        const preferences = (await getPreference(preferencesKey)) || []
        setCollapsed(preferences.indexOf(label) !== -1)
      }
      setCollapsedFromPreferences()
    }
  }, [getPreference, label, preferencesKey])

  if (label) {
    const toggleCollapsed = async () => {
      setAnimate(true)
      let preferences: string[] = (await getPreference(preferencesKey)) || []
      if (collapsed) {
        preferences = preferences.filter((preference) => label !== preference)
      } else {
        preferences.push(label)
      }
      setPreference(preferencesKey, preferences)
      setCollapsed(!collapsed)
    }

    return (
      <div
        className={[`${baseClass}`, `${label}`, collapsed && `${baseClass}--collapsed`]
          .filter(Boolean)
          .join(' ')}
        id={`nav-group-${label}`}
      >
        <button
          className={[
            `${baseClass}__toggle`,
            `${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`,
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={toggleCollapsed}
          tabIndex={!navOpen ? -1 : 0}
          type="button"
        >
          <div className={`${baseClass}__label`}>{label}</div>
          <div className={`${baseClass}__indicator`}>
            <Chevron
              className={`${baseClass}__indicator`}
              direction={!collapsed ? 'up' : undefined}
            />
          </div>
        </button>
        <AnimateHeight duration={animate ? 200 : 0} height={collapsed ? 0 : 'auto'}>
          <div className={`${baseClass}__content`}>{children}</div>
        </AnimateHeight>
      </div>
    )
  }

  return <React.Fragment>{children}</React.Fragment>
}

export default NavGroup
