'use client'
import React, { useCallback, useMemo } from 'react'
import type { TextFieldClientProps } from 'payload'

import { toKebabCase } from '@/utilities/toKebabCase'
import { getTranslation } from '@payloadcms/translations'
import { useField, useForm, useFormModified, useTranslation } from '@payloadcms/ui'
import { sortOptionsByKey } from '@/collections/Products/utilities/sortOptionsByKey'

import type { RadioGroupProps, Option, OptionKey } from '../types'

import classes from './index.module.scss'
import { Product } from '@/payload-types'

export const VariantSelect: React.FC<TextFieldClientProps> = (props) => {
  const {
    field: { label },
    path,
  } = props

  const { getDataByPath, dispatchFields, setModified } = useForm()
  const modified = useFormModified()

  const options: NonNullable<Product['variants']>['options'] = getDataByPath('variants.options')
  const values = useMemo(() => {
    return getDataByPath<Option[]>(path)
  }, [getDataByPath, path, modified])

  const setArray = useCallback(
    (incomingValues: { label: string; slug: string }[]) => {
      // setValue(null)

      // setValue(incomingValues)

      dispatchFields({
        type: 'REPLACE_ROW',
        path,
        rowIndex: 1,
        subFieldState: {
          label: {
            value: 'Large',
          },
          slug: {
            value: 'xlarge',
          },
        },
      })

      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  console.log({ values })

  const { i18n } = useTranslation()

  return (
    <div className={classes.container}>
      <p style={{ marginBottom: '0' }}>{typeof label === 'string' ? label : 'Product'}</p>
      <div>{JSON.stringify(values)}</div>
      {/* <div>{JSON.stringify(rows)}</div> */}
      <div>{JSON.stringify(path)}</div>
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
                    setValue={setArray}
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
      e.preventDefault()
      const selectedOption = [...options].find((option) => {
        if (option.slug === e.target.value) {
          // console.log({ found: option, e: e.target.value, slug: option.slug })
          return true
        }
      }) as OptionKey

      // console.log({ options, selectedOption, e: e.target.value, values })

      if (!selectedOption) return

      if (!values || !values.length) {
        const newValue = [selectedOption]

        const sortedValues = sortOptionsByKey(newValue, fullArray)

        setValue(sortedValues)
        return
      }

      const filteredValues =
        [...values].filter((value) => {
          const isIncluded = options.find((option) => option.slug === value.slug)

          return !Boolean(isIncluded)
        }) ?? []

      const newValue = [...filteredValues, selectedOption]
      // console.log({ filteredValues, newValue, selectedOption, e: e.target.value, options })

      const sortedValues = sortOptionsByKey(newValue, fullArray) /* .map((v) => ({
        slug: v.slug,
        label: v.label,
      })) */

      console.log({ sortedValues: sortedValues, newValue })
      // setValue(null)
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

            <label htmlFor={id}>
              {item.slug} {getTranslation(item.label, i18n)}
            </label>
          </div>
        )
      })}
    </React.Fragment>
  )
}
