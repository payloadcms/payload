'use client'
import type { MultiValueRemoveProps } from 'react-select'

import React, { type JSX } from 'react'

import type { CustomSelectProps, Option as OptionType } from '../types.js'

import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Tooltip } from '../../Tooltip/index.js'
import { getMultiValueLabelID } from '../MultiValueLabel/index.js'
import './index.css'

const baseClass = 'multi-value-remove'

export const MultiValueRemove: React.FC<
  {
    innerProps: JSX.IntrinsicElements['button']
  } & MultiValueRemoveProps<OptionType>
> = (props) => {
  const {
    data,
    innerProps: { 'aria-label': _ariaLabel, className, onClick, onTouchEnd },
    selectProps,
  } = props

  const [showTooltip, setShowTooltip] = React.useState(false)
  const { t } = useTranslation()
  const { customProps, isDisabled } = selectProps as {
    customProps?: CustomSelectProps
  } & typeof selectProps
  const label = customProps?.removeValueLabel || t('general:remove')
  const valueLabelID = getMultiValueLabelID({ data, selectProps })
  const removeLabelID = `${valueLabelID}-remove`

  if (isDisabled) {
    return null
  }

  return (
    <button
      aria-labelledby={`${removeLabelID} ${valueLabelID}`}
      className={[baseClass, className].filter(Boolean).join(' ')}
      onClick={(e) => {
        setShowTooltip(false)
        onClick?.(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation()
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchEnd={onTouchEnd}
      type="button"
    >
      <span className="sr-only" id={removeLabelID}>
        {label}
      </span>
      <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
        {t('general:remove')}
      </Tooltip>
      <XIcon className={`${baseClass}__icon`} size={16} />
    </button>
  )
}
