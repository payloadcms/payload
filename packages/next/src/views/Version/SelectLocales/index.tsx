'use client'

import { AnimateHeight } from '@payloadcms/ui'
import { PillSelector, type SelectablePill } from '@payloadcms/ui'
import React from 'react'

const baseClass = 'select-version-locales'

export type SelectedLocaleOnChange = (args: { locales: SelectablePill[] }) => void
export type Props = {
  locales: SelectablePill[]
  localeSelectorOpen: boolean
  onChange: SelectedLocaleOnChange
}

export const SelectLocales: React.FC<Props> = ({ locales, localeSelectorOpen, onChange }) => {
  return (
    <AnimateHeight
      className={baseClass}
      height={localeSelectorOpen ? 'auto' : 0}
      id={`${baseClass}-locales`}
    >
      <PillSelector
        onClick={({ pill }) => {
          const newLocales = locales.map((locale) => {
            if (locale.name === pill.name) {
              return {
                ...locale,
                selected: !pill.selected,
              }
            } else {
              return locale
            }
          })
          onChange({ locales: newLocales })
        }}
        pills={locales}
      />
    </AnimateHeight>
  )
}
