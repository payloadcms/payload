'use client'

import React from 'react'

import type { Theme } from './types'

import { useTheme } from '..'
import { Chevron } from '../../../_components/Chevron'
import { getImplicitPreference } from '../shared'
import classes from './index.module.scss'
import { themeLocalStorageKey } from './types'

export const ThemeSelector: React.FC = () => {
  const selectRef = React.useRef<HTMLSelectElement>(null)
  const { setTheme } = useTheme()
  const [show, setShow] = React.useState(false)

  const onThemeChange = (themeToSet: Theme & 'auto') => {
    if (themeToSet === 'auto') {
      setTheme(null)
      if (selectRef.current) selectRef.current.value = 'auto'
    } else {
      setTheme(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    if (selectRef.current) {
      selectRef.current.value = preference ?? 'auto'
      setShow(true)
    }
  }, [])

  return (
    <div className={[classes.selectContainer, !show && classes.hidden].filter(Boolean).join(' ')}>
      <label htmlFor="theme">
        <select
          className={classes.select}
          id="theme"
          onChange={(e) => onThemeChange(e.target.value as Theme & 'auto')}
          ref={selectRef}
        >
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <div className={classes.selectIcon}>
          <Chevron className={classes.iconUp} />
          <Chevron className={classes.iconDown} />
        </div>
      </label>
    </div>
  )
}
