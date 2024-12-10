'use client'
import React from 'react'

import { useField } from '../../../forms/useField/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'section-title'

export type Props = {
  customOnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  customValue?: string
  path: string
  readOnly: boolean
}

/**
 * An input field representing the block's `blockName` property - responsible for reading and saving the `blockName`
 * property from/into the provided path.
 */
export const SectionTitle: React.FC<Props> = (props) => {
  const { customOnChange, customValue, path, readOnly } = props

  const { setValue, value } = useField({ path })
  const { t } = useTranslation()

  const classes = [baseClass].filter(Boolean).join(' ')

  const onChange =
    customOnChange ||
    ((e) => {
      e.stopPropagation()
      e.preventDefault()
      setValue(e.target.value)
    })

  return (
    <div className={classes} data-value={customValue || value}>
      <input
        className={`${baseClass}__input`}
        id={path}
        name={path}
        onChange={onChange}
        placeholder={t('general:untitled')}
        readOnly={readOnly}
        type="text"
        value={customValue || (value as string) || ''}
      />
    </div>
  )
}
