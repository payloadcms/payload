'use client'
import type { ReactSelectAdapterProps } from '@payloadcms/ui'
import type { Option, OptionObject, SelectFieldClientProps } from 'payload'

import {
  formatOptions,
  mergeFieldStyles,
  SelectInput,
  useConfig,
  useDocumentInfo,
  useField,
  useFormFields,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

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

  const { config } = useConfig()

  const [parentHierarchyType, setParentHierarchyType] = useState<null | string[]>(null)

  const parentFieldValue = useFormFields(([fields]) => fields?.[parentFieldName]?.value)
  const { collectionSlug } = useDocumentInfo()
  const parentId = parentFieldValue as null | number | string

  // Fetch parent's hierarchyType when parent changes
  useEffect(() => {
    const fetchParentHierarchyType = async () => {
      if (!parentId) {
        setParentHierarchyType(null)
        return
      }

      try {
        const response = await fetch(
          formatAdminURL({
            apiRoute: config.routes.api,
            path: `/${collectionSlug}/${parentId}`,
            serverURL: config.serverURL,
          }),
          { credentials: 'include' },
        )

        if (response.ok) {
          const parentData = await response.json()
          const types = parentData?.hierarchyType as string[] | undefined
          setParentHierarchyType(types && types.length > 0 ? types : null)
        } else {
          setParentHierarchyType(null)
        }
      } catch {
        setParentHierarchyType(null)
      }
    }

    void fetchParentHierarchyType()
  }, [parentId, config.routes.api, config.serverURL, collectionSlug])

  const options = useMemo(() => {
    if (!parentHierarchyType || parentHierarchyType.length === 0) {
      return formatOptions(allSelectOptions)
    }

    return formatOptions(
      allSelectOptions.filter((option) => {
        if (typeof option === 'object' && 'value' in option && option.value) {
          return parentHierarchyType.includes(option.value)
        }
        return true
      }),
    )
  }, [allSelectOptions, parentHierarchyType])

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
    required || (Array.isArray(parentHierarchyType) && parentHierarchyType.length > 0)

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
