'use client'
import React, { useCallback } from 'react'
import type { TextFieldClientProps } from 'payload'

import { toKebabCase } from '@/utilities/toKebabCase'
import { getTranslation } from '@payloadcms/translations'
import { useField, useForm, useTranslation } from '@payloadcms/ui'
import { sortOptionsByKey } from '@/collections/Products/utilities/sortOptionsByKey'

import type { RadioGroupProps, Option, OptionKey } from '../types'

import classes from './index.module.scss'
import { Product } from '@/payload-types'

export const VariantSelect: React.FC<TextFieldClientProps> = (props) => {
  const {
    field: { label },
    path,
  } = props

  const { setValue } = useField({ path })
  const { getDataByPath } = useForm()

  const options: NonNullable<Product['variants']>['options'] = getDataByPath('variants.options')
  const values = getDataByPath<Option[]>(path)

  const { i18n } = useTranslation()

  return (
    <div className={classes.container}>
      <p style={{ marginBottom: '0' }}>{typeof label === 'string' ? label : 'Product'}</p>
      <div className={classes.groupsContainer}>
        {options?.length &&
          options.map((option) => {
            if (!option || !option.slug || !option.values) return null

            return (
              <div className={classes.group} key={toKebabCase(option?.slug)}>
                <div className={classes.groupLabel}>
                  {getTranslation(option.label, i18n)}{' '}
                  <span className={classes.requiredIndicator}>*</span>
                </div>
                <div className={classes.groupItems}>
                  <RadioGroup
                    fullArray={options}
                    group={option}
                    options={option.values}
                    path={path}
                    setValue={setValue}
                    values={values}
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
  values,
}) => {
  const { i18n } = useTranslation()

  const handleOnChange = useCallback(
    (e) => {
      const selectedOption = options.find((option) => option.slug === e.target.value) as OptionKey

      if (!selectedOption) return

      const filteredValues =
        values?.filter((value) => {
          const isIncluded = options.find((option) => option.slug === value.slug)

          return !isIncluded
        }) ?? []

      const newValue = [...filteredValues, selectedOption]

      const sortedValues = sortOptionsByKey(newValue, fullArray)

      setValue(sortedValues)
    },
    [options, values, fullArray, setValue],
  )

  return (
    <React.Fragment>
      {options.map((item) => {
        const id = `${path}_${item.slug}`
        const name = `${path}_${group.slug}`

        const isChecked =
          values && Array.isArray(values) && values.some((v) => v.slug === item.slug)

        return (
          <div className={classes.fieldItem} key={id}>
            <input
              defaultChecked={isChecked}
              id={id}
              name={name}
              onChange={handleOnChange}
              required
              type="radio"
              value={item.slug}
            />
            <label htmlFor={id}>{getTranslation(item.label, i18n)}</label>
          </div>
        )
      })}
    </React.Fragment>
  )
}
