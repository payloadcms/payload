'use client'
import type { ReactSelectAdapterProps } from '@payloadcms/ui'
import type { Option, OptionObject, SelectFieldClientProps } from 'payload'

import {
  formatOptions,
  mergeFieldStyles,
  SelectInput,
  useField,
  useHierarchy,
} from '@payloadcms/ui'
import React, { useCallback, useMemo } from 'react'

type HierarchyTypeFieldProps = {
  options: Option[]
  parentFieldName: string
} & SelectFieldClientProps

export const HierarchyTypeField: React.FC<HierarchyTypeFieldProps> = ({
  options: allSelectOptions,
  parentFieldName,
  ...props
}) => {
  const {
    field,
    field: {
      name,
      admin: { className, isClearable = true, isSortable = true, placeholder } = {} as NonNullable<
        SelectFieldClientProps['field']['admin']
      >,
      hasMany = false,
      label,
      localized,
      required,
    },
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const { allowedCollections } = useHierarchy()

  const options = useMemo(() => {
    if (!allowedCollections || allowedCollections.length === 0) {
      return formatOptions(allSelectOptions)
    }

    return formatOptions(
      allSelectOptions.filter((option) => {
        if (typeof option === 'object' && 'value' in option && option.value) {
          return allowedCollections.some((c) => c.slug === option.value)
        }
        return true
      }),
    )
  }, [allSelectOptions, allowedCollections])

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    selectFilterOptions,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate,
  })

  const onChange: ReactSelectAdapterProps['onChange'] = useCallback(
    (selectedOption: OptionObject | OptionObject[]) => {
      if (readOnly || disabled) {
        return
      }

      let newValue: null | string | string[] = null

      if (selectedOption && hasMany) {
        if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => option.value)
        } else {
          newValue = []
        }
      } else if (selectedOption && !Array.isArray(selectedOption)) {
        newValue = selectedOption.value
      }

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newValue)
      }

      setValue(newValue)
    },
    [readOnly, disabled, hasMany, setValue, onChangeFromProps],
  )

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  const isRequired =
    required || (Array.isArray(allowedCollections) && allowedCollections.length > 0)

  return (
    <div>
      <SelectInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        className={className}
        Description={Description}
        description="Select the collection types this item can contain"
        Error={Error}
        filterOption={
          selectFilterOptions
            ? ({ value: optionValue }) =>
                selectFilterOptions?.some(
                  (option) => (typeof option === 'string' ? option : option.value) === optionValue,
                )
            : undefined
        }
        hasMany={hasMany}
        isClearable={isClearable}
        isSortable={isSortable}
        Label={Label}
        label={label}
        localized={localized}
        name={name}
        onChange={onChange}
        options={options}
        path={path}
        placeholder={placeholder}
        readOnly={readOnly || disabled}
        required={isRequired}
        showError={showError}
        style={styles}
        value={value as string | string[]}
      />
    </div>
  )
}
