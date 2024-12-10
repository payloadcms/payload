'use client'
import type { MultiValueRemoveProps } from 'react-select'

import React, { type JSX } from 'react'

import type { Option as OptionType } from '../types.js'

import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Tooltip } from '../../Tooltip/index.js'
import './index.scss'

const baseClass = 'multi-value-remove'

export const MultiValueRemove: React.FC<
  {
    innerProps: JSX.IntrinsicElements['button']
  } & MultiValueRemoveProps<OptionType>
> = (props) => {
  const {
    innerProps: { className, onClick, onTouchEnd },
  } = props

  const [showTooltip, setShowTooltip] = React.useState(false)
  const { t } = useTranslation()

  return (
    <button
      aria-label={t('general:remove')}
      className={[baseClass, className].filter(Boolean).join(' ')}
      onClick={(e) => {
        setShowTooltip(false)
        onClick(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation()
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchEnd={onTouchEnd}
      type="button"
    >
      <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
        {t('general:remove')}
      </Tooltip>
      <XIcon className={`${baseClass}__icon`} />
    </button>
  )
}
