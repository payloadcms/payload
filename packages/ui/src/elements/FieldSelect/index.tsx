'use client'
import type { ClientFieldConfig, FieldWithPath, MappedComponent } from 'payload'

import React, { Fragment, type JSX, useState } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/context.js'
import { createNestedClientFieldPath } from '../../forms/Form/createNestedFieldPath.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import './index.scss'

const baseClass = 'field-select'

export type FieldSelectProps = {
  fields: ClientFieldConfig[]
  setSelected: (fields: FieldWithPath[]) => void
}

export const combineLabel = ({
  customLabel,
  field,
  prefix,
}: {
  customLabel?: string
  field?: ClientFieldConfig
  prefix?: JSX.Element | string
}): JSX.Element => {
  const CustomLabelToRender: MappedComponent =
    field &&
    'CustomLabel' in field.fieldComponentProps &&
    field.fieldComponentProps.CustomLabel !== undefined
      ? field.fieldComponentProps.CustomLabel
      : null
  const DefaultLabelToRender: MappedComponent =
    field && 'label' in field.fieldComponentProps && field.fieldComponentProps.label
      ? {
          type: 'client',
          Component: FieldLabel,
          props: {
            label: field.fieldComponentProps.label,
            ...(field.fieldComponentProps.labelProps || {}),
          },
        }
      : null

  const LabelToRender: MappedComponent = CustomLabelToRender ||
    DefaultLabelToRender || {
      type: 'client',
      Component: null,
      RenderedComponent: customLabel,
    }

  if (!LabelToRender) return null

  return (
    <Fragment>
      {prefix && (
        <Fragment>
          <span style={{ display: 'inline-block' }}>{prefix}</span>
          {' > '}
        </Fragment>
      )}
      <span style={{ display: 'inline-block' }}>
        <RenderComponent mappedComponent={LabelToRender} />
      </span>
    </Fragment>
  )
}

const reduceFields = ({
  fields,
  labelPrefix = null,
  path = '',
}: {
  fields: ClientFieldConfig[]
  labelPrefix?: JSX.Element | string
  path?: string
}): { Label: JSX.Element; value: FieldWithPath }[] => {
  if (!fields) {
    return []
  }

  return fields?.reduce((fieldsToUse, field) => {
    const { isFieldAffectingData } = field
    // escape for a variety of reasons
    if (
      isFieldAffectingData &&
      (field.disableBulkEdit ||
        field.unique ||
        field.isHidden ||
        ('readOnly' in field.fieldComponentProps && field.fieldComponentProps.readOnly))
    ) {
      return fieldsToUse
    }

    if (
      !(field.type === 'array' || field.type === 'blocks') &&
      'fieldMap' in field.fieldComponentProps
    ) {
      return [
        ...fieldsToUse,
        ...reduceFields({
          fieldMap: field.fieldComponentProps.fieldMap,
          labelPrefix: combineLabel({ field, prefix: labelPrefix }),
          path: createNestedClientFieldPath(path, field),
        }),
      ]
    }

    if (field.type === 'tabs' && 'tabs' in field.fieldComponentProps) {
      return [
        ...fieldsToUse,
        ...field.fieldComponentProps.tabs.reduce((tabFields, tab) => {
          if ('fieldMap' in tab) {
            const isNamedTab = 'name' in tab && tab.name
            return [
              ...tabFields,
              ...reduceFields({
                fieldMap: tab.fieldMap,
                labelPrefix,
                path: isNamedTab ? createNestedClientFieldPath(path, field) : path,
              }),
            ]
          }
        }, []),
      ]
    }

    const formattedField = {
      label: combineLabel({ field, prefix: labelPrefix }),
      value: {
        ...field,
        path: createNestedClientFieldPath(path, field),
      },
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

export const FieldSelect: React.FC<FieldSelectProps> = ({ fields, setSelected }) => {
  const { t } = useTranslation()
  const [options] = useState(() => reduceFields({ fields }))

  const { dispatchFields, getFields } = useForm()

  const handleChange = (selected) => {
    const activeFields = getFields()
    if (selected === null) {
      setSelected([])
    } else {
      setSelected(selected.map(({ value }) => value))
    }

    // remove deselected values from form state
    if (selected === null || Object.keys(activeFields || []).length > selected.length) {
      Object.keys(activeFields).forEach((path) => {
        if (
          selected === null ||
          !selected.find((field) => {
            return field.value.path === path
          })
        ) {
          dispatchFields({
            type: 'REMOVE',
            path,
          })
        }
      })
    }
  }

  return (
    <div className={baseClass}>
      <FieldLabel label={t('fields:selectFieldsToEdit')} />
      <ReactSelect
        getOptionValue={(option) => {
          if (typeof option.value === 'object' && 'path' in option.value) {
            return String(option.value.path)
          }
          return String(option.value)
        }}
        isMulti
        onChange={handleChange}
        options={options}
      />
    </div>
  )
}
