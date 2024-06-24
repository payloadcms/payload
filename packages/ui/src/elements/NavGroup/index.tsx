'use client'
import React, { useEffect, useState } from 'react'
import AnimateHeightImport from 'react-animate-height'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useNav } from '../Nav/context.js'
import './index.scss'

const AnimateHeight = (AnimateHeightImport.default ||
  AnimateHeightImport) as typeof AnimateHeightImport.default

const baseClass = 'nav-group'

type Props = {
  children: React.ReactNode
  label: string
}

export const NavGroup: React.FC<Props> = ({ children, label }) => {
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
      void setCollapsedFromPreferences()
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
      void setPreference(preferencesKey, preferences)
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
            <ChevronIcon
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
