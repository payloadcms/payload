import type { Option, OptionObject, SelectFieldClientProps } from 'payload'

import React from 'react'

import type { ReactSelectAdapterProps } from '../../ReactSelect/types.js'

import { mergeFieldStyles } from '../../../fields/mergeFieldStyles.js'
import { formatOptions } from '../../../fields/Select/index.js'
import { SelectInput } from '../../../fields/Select/Input.js'
import { useField } from '../../../forms/useField/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const FolderTypeField = ({
  options: allSelectOptions,
  ...props
}: { options: Option[] } & SelectFieldClientProps) => {
  const {
    field,
    field: {
      name,
      admin: {
        className,
        isClearable = true,
        isSortable = true,
        placeholder,
      } = {} as SelectFieldClientProps['field']['admin'],
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
  const { t } = useTranslation()

  const { folderType } = useFolder()

  const options = React.useMemo(() => {
    if (!folderType || folderType.length === 0) {
      return formatOptions(allSelectOptions)
    }
    return formatOptions(
      allSelectOptions.filter((option) => {
        if (typeof option === 'object' && option.value) {
          return folderType.includes(option.value)
        }
        return true
      }),
    )
  }, [allSelectOptions, folderType])

  const memoizedValidate = React.useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, hasMany, options, required })
      }
    },
    [validate, required, hasMany, options],
  )

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
    validate: memoizedValidate,
  })

  const onChange: ReactSelectAdapterProps['onChange'] = React.useCallback(
    (selectedOption: OptionObject | OptionObject[]) => {
      if (!readOnly || disabled) {
        let newValue: string | string[] = null
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
      }
    },
    [readOnly, disabled, hasMany, setValue, onChangeFromProps],
  )

  const styles = React.useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div>
      <SelectInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        className={className}
        Description={Description}
        description={t('folder:folderTypeDescription')}
        Error={Error}
        filterOption={
          selectFilterOptions
            ? ({ value }) =>
                selectFilterOptions?.some(
                  (option) => (typeof option === 'string' ? option : option.value) === value,
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
        required={required || (Array.isArray(folderType) && folderType.length > 0)}
        showError={showError}
        style={styles}
        value={value as string | string[]}
      />
    </div>
  )
}
