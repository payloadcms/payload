'use client'

import React, { useCallback, useMemo } from 'react'

import type { Option as ReactSelectOption } from '../../../elements/ReactSelect/index.js'

import { ReactSelect } from '../../../elements/ReactSelect/index.js'
import { FieldLabel } from '../../../fields/FieldLabel/index.js'
import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const ToggleTheme: React.FC = () => {
  const { autoMode, setTheme, theme } = useTheme()
  const { t } = useTranslation()

  const options = useMemo(
    () => [
      { label: t('general:automatic'), value: 'auto' },
      { label: t('general:light'), value: 'light' },
      { label: t('general:dark'), value: 'dark' },
    ],
    [t],
  )

  const activeValue = autoMode ? 'auto' : theme

  const onChange = useCallback(
    (option: ReactSelectOption) => {
      setTheme(option.value as 'auto' | 'dark' | 'light')
    },
    [setTheme],
  )

  return (
    <div className="payload-settings__theme">
      <FieldLabel htmlFor="theme-select" label={t('general:adminTheme')} />
      <ReactSelect
        inputId="theme-select"
        isClearable={false}
        onChange={onChange}
        options={options}
        value={options.find((o) => o.value === activeValue)}
      />
    </div>
  )
}
