'use client'
import type { OptionObject, RadioFieldClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useEditDepth } from '../../../providers/EditDepth/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'radio-input'

export const Radio: React.FC<{
  id: string
  isSelected: boolean
  onChange: RadioFieldClientProps['onChange']
  option: OptionObject
  path: string
  readOnly?: boolean
  uuid?: string
}> = (props) => {
  const { isSelected, onChange, option, path, readOnly, uuid } = props
  const { i18n } = useTranslation()

  const editDepth = useEditDepth()

  const id = `field-${path}-${option.value}${editDepth > 1 ? `-${editDepth}` : ''}${uuid ? `-${uuid}` : ''}`

  return (
    <label htmlFor={id}>
      <div
        className={[baseClass, isSelected && `${baseClass}--is-selected`].filter(Boolean).join(' ')}
      >
        <input
          checked={isSelected}
          disabled={readOnly}
          id={id}
          name={path}
          onChange={() => (typeof onChange === 'function' ? onChange(option.value) : null)}
          type="radio"
        />
        <span
          className={[
            `${baseClass}__styled-radio`,
            readOnly && `${baseClass}__styled-radio--disabled`,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className={`${baseClass}__label`}>{getTranslation(option.label, i18n)}</span>
      </div>
    </label>
  )
}
