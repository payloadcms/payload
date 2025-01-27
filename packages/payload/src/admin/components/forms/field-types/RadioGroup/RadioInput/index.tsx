import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../../../utilities/getTranslation'
import { useEditDepth } from '../../../../utilities/EditDepth'
import './index.scss'

const baseClass = 'radio-input'

const RadioInput: React.FC<Props> = (props) => {
  const { isSelected, onChange, option, path, readOnly } = props
  const { i18n } = useTranslation()

  const editDepth = useEditDepth()

  const classes = [baseClass, isSelected && `${baseClass}--is-selected`].filter(Boolean).join(' ')

  const id = `field-${path}-${option.value}${editDepth > 1 ? `-${editDepth}` : ''}`

  return (
    <label htmlFor={id}>
      <div className={classes}>
        <input
          checked={isSelected}
          disabled={readOnly}
          id={id}
          onChange={() => (typeof onChange === 'function' ? onChange(option.value) : null)}
          type="radio"
        />
        <span className={`${baseClass}__styled-radio`} />
        <span className={`${baseClass}__label`}>{getTranslation(option.label, i18n)}</span>
      </div>
    </label>
  )
}

export default RadioInput
