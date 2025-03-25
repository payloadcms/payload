'use client'
import type { RadioFieldClientComponent, RadioFieldClientProps } from 'payload'

import { optionIsObject } from 'payload/shared'
import React, { useCallback, useMemo } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { fieldBaseClass } from '../shared/index.js'
import { Radio } from './Radio/index.js'

const baseClass = 'radio-group'

const RadioGroupFieldComponent: RadioFieldClientComponent = (props) => {
  const {
    disableModifyingForm: disableModifyingFormFromProps,
    field,
    field: {
      admin: {
        className,
        description,
        layout = 'horizontal',
      } = {} as RadioFieldClientProps['field']['admin'],
      label,
      localized,
      options = [],
      required,
    } = {} as RadioFieldClientProps['field'],
    onChange: onChangeFromProps,
    path,
    readOnly,
    validate,
    value: valueFromProps,
  } = props

  const { uuid } = useForm()

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, options, required })
      }
    },
    [validate, options, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    setValue,
    showError,
    value: valueFromContext,
  } = useField<string>({
    path,
    validate: memoizedValidate,
  })

  const value = valueFromContext || valueFromProps

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        `${baseClass}--layout-${layout}`,
        showError && 'error',
        (readOnly || disabled) && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Error}
        Fallback={<FieldError path={path} showError={showError} />}
      />
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        {BeforeInput}
        <ul className={`${baseClass}--group`} id={`field-${path.replace(/\./g, '__')}`}>
          {options.map((option) => {
            let optionValue = ''

            if (optionIsObject(option)) {
              optionValue = option.value
            } else {
              optionValue = option
            }

            const isSelected = String(optionValue) === String(value)

            const id = `field-${path}-${optionValue}${uuid ? `-${uuid}` : ''}`

            return (
              <li key={`${path} - ${optionValue}`}>
                <Radio
                  id={id}
                  isSelected={isSelected}
                  onChange={() => {
                    if (typeof onChangeFromProps === 'function') {
                      onChangeFromProps(optionValue)
                    }

                    if (!(readOnly || disabled)) {
                      setValue(optionValue, !!disableModifyingFormFromProps)
                    }
                  }}
                  option={optionIsObject(option) ? option : { label: option, value: option }}
                  path={path}
                  readOnly={readOnly || disabled}
                  uuid={uuid}
                />
              </li>
            )
          })}
        </ul>
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}

export const RadioGroupField: any = withCondition(RadioGroupFieldComponent)
