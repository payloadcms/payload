'use client'
import type { Product } from '@/payload-types'
import type { TextFieldClientProps } from 'payload'

import { toKebabCase } from '@/utilities/toKebabCase'
import { getTranslation } from '@payloadcms/translations'
import { useField, useForm, useFormFields, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'
import { sortOptionsByKey } from '@/collections/Products/utilities/sortOptionsByKey'

import type { InfoType, RadioGroupProps } from '../types'

import classes from './index.module.scss'

export const VariantSelect: React.FC<TextFieldClientProps> = (props) => {
  const {
    field: { label },
    path,
  } = props

  const { setValue, value } = useField<string[]>({ path })
  const [variantPath] = path.split(/\.(?=[^.]+$)/)
  const { getDataByPath } = useForm()
  const variantInfoPath = path.includes('.') ? variantPath + '.info' : 'info'

  const keys: any = getDataByPath('variants.options')

  const { dispatchFields, infoField } = useFormFields(([fields, dispatchFields]) => ({
    dispatchFields,
    infoField: fields[variantInfoPath],
  }))

  const variantInfo = infoField.value

  const { i18n } = useTranslation()

  const handleUpdate = useCallback(
    (newValue: string[]) => {
      const options: InfoType['options'] = []

      newValue.forEach((value: string) => {
        keys.forEach((group) => {
          group.values.forEach((option) => {
            if (option.slug === value) {
              options.push({
                slug: option.slug,
                key: {
                  slug: group.slug,
                  label: group.label,
                },
                label: option.label,
              })
            }
          })
        })
      })

      const existingVariantInfo = variantInfo ? (variantInfo as InfoType) : {}

      const newVariantInfo: Partial<InfoType> = {
        ...existingVariantInfo,
        options,
      }

      dispatchFields({
        type: 'UPDATE',
        path: variantInfoPath,
        value: newVariantInfo,
      })

      setValue(newValue)
    },
    [variantInfo, dispatchFields, variantInfoPath, setValue, keys],
  )

  return (
    <div className={classes.container}>
      <p style={{ marginBottom: '0' }}>{typeof label === 'string' ? label : 'Product'}</p>
      <div className={classes.groupsContainer}>
        {keys.length &&
          keys.map((key) => {
            return (
              <div className={classes.group} key={toKebabCase(key.slug)}>
                <div className={classes.groupLabel}>
                  {getTranslation(key.label, i18n)}{' '}
                  <span className={classes.requiredIndicator}>*</span>
                </div>
                <div className={classes.groupItems}>
                  <RadioGroup
                    fullArray={keys}
                    group={key}
                    options={key.values}
                    path={path}
                    setValue={handleUpdate}
                    value={value}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  fullArray,
  group,
  options,
  path,
  setValue,
  value,
}) => {
  const { i18n } = useTranslation()

  const handleOnChange = useCallback(
    (e) => {
      const filteredValues =
        value?.filter((value) => {
          const isIncluded = options.find((option) => option.slug === value)

          return !isIncluded
        }) ?? []

      const newValue = [...filteredValues, e.target.value]

      const sortedValues = sortOptionsByKey(newValue, fullArray)

      setValue(sortedValues)
    },
    [options, value, setValue, fullArray],
  )

  return (
    <React.Fragment>
      {options.map((item) => {
        const id = `${path}_${item.slug}`
        const name = `${path}_${group.slug}`

        return (
          <div className={classes.fieldItem} key={id}>
            <input
              defaultChecked={value && Array.isArray(value) && value?.includes(item.slug)}
              id={id}
              name={name}
              onChange={handleOnChange}
              required
              type="radio"
              value={item.slug}
            />
            <label htmlFor={id}>{getTranslation(item.label, i18n)} </label>
          </div>
        )
      })}
    </React.Fragment>
  )
}
