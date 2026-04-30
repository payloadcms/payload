'use client'
import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'input-stepper'

export type InputStepperProps = {
  readonly disabled?: boolean
  readonly onDecrement: () => void
  readonly onIncrement: () => void
}

export const InputStepper: React.FC<InputStepperProps> = ({
  disabled,
  onDecrement,
  onIncrement,
}) => {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <button
        aria-label={t('general:increment')}
        disabled={disabled}
        onClick={onIncrement}
        tabIndex={-1}
        type="button"
      >
        <ChevronIcon direction="up" size={16} />
      </button>
      <button
        aria-label={t('general:decrement')}
        disabled={disabled}
        onClick={onDecrement}
        tabIndex={-1}
        type="button"
      >
        <ChevronIcon direction="down" size={16} />
      </button>
    </div>
  )
}
