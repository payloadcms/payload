import type { MultiValueRemoveProps } from 'react-select'

import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Option as OptionType } from '../types.js'

import X from '../../../icons/X/index.js'
import Tooltip from '../../Tooltip/index.js'
import './index.scss'

const baseClass = 'multi-value-remove'

export const MultiValueRemove: React.FC<
  MultiValueRemoveProps<OptionType> & {
    innerProps: JSX.IntrinsicElements['button']
  }
> = (props) => {
  const {
    innerProps: { className, onClick, onTouchEnd },
  } = props

  const [showTooltip, setShowTooltip] = React.useState(false)
  const { t } = useTranslation('general')

  return (
    <button
      onClick={(e) => {
        setShowTooltip(false)
        onClick(e)
      }}
      aria-label={t('remove')}
      className={[baseClass, className].filter(Boolean).join(' ')}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchEnd={onTouchEnd}
      type="button"
    >
      <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
        {t('remove')}
      </Tooltip>
      <X className={`${baseClass}__icon`} />
    </button>
  )
}
