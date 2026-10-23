'use client'
import type { ClearIndicatorProps } from 'react-select'

import React from 'react'

import type { CustomSelectProps, Option as OptionType } from '../types.js'

import { CircledXIcon } from '../../../icons/CircledX/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'clear-indicator'

export const ClearIndicator: React.FC<ClearIndicatorProps<OptionType, true>> = (props) => {
  const { clearValue, selectProps } = props
  const { t } = useTranslation()
  const { customProps } = selectProps as {
    customProps?: CustomSelectProps
  } & typeof selectProps
  const label = customProps?.clearValueLabel || t('general:clear')

  return (
    <button
      aria-label={label}
      className={baseClass}
      onClick={(event) => {
        event.stopPropagation()
        clearValue()
      }}
      onKeyDown={(event) => {
        if (event.key === ' ') {
          event.stopPropagation()
        }
      }}
      onMouseDown={(event) => event.stopPropagation()}
      type="button"
    >
      <CircledXIcon className={`${baseClass}__icon`} size={24} />
    </button>
  )
}
