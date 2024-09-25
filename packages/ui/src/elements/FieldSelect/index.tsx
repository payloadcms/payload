'use client'
import type { ClientField, FieldWithPath, MappedComponent } from 'payload'

import { fieldAffectsData, fieldHasSubFields } from 'payload/shared'
import React, { Fragment, type JSX, useState } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/context.js'
import { createNestedClientFieldPath } from '../../forms/Form/createNestedClientFieldPath.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { RenderComponent } from '../RenderComponent/index.js'
import './index.scss'

const baseClass = 'field-select'

export type FieldSelectProps = {
  readonly fields: ClientField[]
  readonly setSelected: (fields: FieldWithPath[]) => void
}

export const combineLabel = ({
  customLabel,
  field,
  prefix,
}: {
  customLabel?: string
  field?: ClientField
  prefix?: JSX.Element | string
}): JSX.Element => {
  const CustomLabelToRender: MappedComponent =
    field?.admin?.components &&
    'Label' in field.admin.components &&
    field?.admin?.components?.Label !== undefined
      ? field.admin.components.Label
      : null

  const DefaultLabelToRender: MappedComponent =
    field && 'label' in field && field.label
      ? {
          type: 'client',
          Component: FieldLabel,
          props: {
            Label:
              field.admin?.components && 'Label' in field.admin.components
                ? field.admin?.components?.Label
                : null,
            label: field.label,
          },
        }
      : null

  const LabelToRender: MappedComponent = CustomLabelToRender ||
    DefaultLabelToRender || {
      type: 'client',
      Component: null,
      RenderedComponent: customLabel,
    }

  if (!LabelToRender) {
    return null
  }

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
  fields: ClientField[]
  labelPrefix?: JSX.Element | string
  path?: string
}): { Label: JSX.Element; value: FieldWithPath }[] => {
  if (!fields) {
    return []
  }

  return fields?.reduce((fieldsToUse, field) => {
    // escape for a variety of reasons
    if (
      fieldAffectsData(field) &&
      (field.admin.disableBulkEdit ||
        field.unique ||
        field.admin.hidden ||
        ('readOnly' in field && field.readOnly))
    ) {
      return fieldsToUse
    }

    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFields({
          fields: field.fields,
          labelPrefix: combineLabel({ field, prefix: labelPrefix }),
          path: createNestedClientFieldPath(path, field),
        }),
      ]
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          if ('fields' in tab) {
            const isNamedTab = 'name' in tab && tab.name
            return [
              ...tabFields,
              ...reduceFields({
                fields: tab.fields,
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
      <FieldLabel field={null} label={t('fields:selectFieldsToEdit')} />
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
