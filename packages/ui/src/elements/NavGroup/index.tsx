'use client'
import type { NavPreferences } from 'payload'

import React, { useState } from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import './index.scss'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { useNav } from '../Nav/context.js'

const baseClass = 'nav-group'

type Props = {
  children: React.ReactNode
  isOpen?: boolean
  label: string
}

const preferencesKey = 'nav'

export const NavGroup: React.FC<Props> = ({ children, isOpen: isOpenFromProps, label }) => {
  const [collapsed, setCollapsed] = useState(
    typeof isOpenFromProps !== 'undefined' ? !isOpenFromProps : false,
  )

  const [animate, setAnimate] = useState(false)
  const { setPreference } = usePreferences()
  const { navOpen } = useNav()

  if (label) {
    const toggleCollapsed = () => {
      setAnimate(true)
      const newGroupPrefs: NavPreferences['groups'] = {}

      if (!newGroupPrefs?.[label]) {
        newGroupPrefs[label] = { open: Boolean(collapsed) }
      } else {
        newGroupPrefs[label].open = Boolean(collapsed)
      }

      void setPreference(preferencesKey, { groups: newGroupPrefs }, true)
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
