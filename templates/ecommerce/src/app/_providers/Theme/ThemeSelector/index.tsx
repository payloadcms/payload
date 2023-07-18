'use client'

import React from 'react'

import { Chevron } from '../../../_components/Chevron'
import { useTheme } from '..'
import { getImplicitPreference } from '../shared'
import { Theme, themeLocalStorageKey } from './types'

import classes from './index.module.scss'

export const ThemeSelector: React.FC = () => {
  const selectRef = React.useRef<HTMLSelectElement>(null)
  const { setTheme } = useTheme()

  const onThemeChange = (themeToSet: Theme & 'auto') => {
    if (themeToSet === 'auto') {
      const implicitPreference = getImplicitPreference() ?? 'light'
      setTheme(implicitPreference)
      if (selectRef.current) selectRef.current.value = 'auto'
    } else {
      setTheme(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    if (selectRef.current) {
      selectRef.current.value = preference ?? 'auto'
    }
  }, [])

  return (
    <div className={classes.selectContainer}>
      <label htmlFor="theme">
        <select
          id="theme"
          onChange={e => onThemeChange(e.target.value as Theme & 'auto')}
          ref={selectRef}
          className={classes.select}
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
