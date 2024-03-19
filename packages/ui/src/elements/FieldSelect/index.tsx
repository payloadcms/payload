import type { FieldWithPath } from 'payload/types'

import React, { Fragment, useState } from 'react'

import type { FieldMap, MappedField } from '../../index.js'

import { useForm } from '../../forms/Form/context.js'
import { createNestedClientFieldPath } from '../../forms/Form/createNestedFieldPath.js'
import Label from '../../forms/Label/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import ReactSelect from '../ReactSelect/index.js'
import './index.scss'

const baseClass = 'field-select'

type Props = {
  fieldMap: FieldMap
  setSelected: (fields: FieldWithPath[]) => void
}

const combineLabel = (prefix: JSX.Element, field: MappedField): JSX.Element => {
  return (
    <Fragment>
      <span style={{ display: 'inline-block' }}>{prefix}</span>
      {prefix ? (
        <Fragment>
          &nbsp;
          {'>'}
          &nbsp;
        </Fragment>
      ) : (
        ''
      )}
      <span style={{ display: 'inline-block' }}>{field.fieldComponentProps.Label}</span>
    </Fragment>
  )
}

const reduceFields = (
  fieldMap: FieldMap,
  path = '',
  labelPrefix: JSX.Element = null,
): { Label: JSX.Element; value: FieldWithPath }[] => {
  if (!fieldMap) {
    return []
  }

  return fieldMap?.reduce((fieldsToUse, field) => {
    const { isFieldAffectingData } = field
    // escape for a variety of reasons
    if (
      isFieldAffectingData &&
      (field.admin?.disableBulkEdit ||
        field.unique ||
        field.isHidden ||
        field.fieldComponentProps?.readOnly)
    ) {
      return fieldsToUse
    }

    if (
      !(field.type === 'array' || field.type === 'blocks') &&
      'fieldMap' in field.fieldComponentProps
    ) {
      return [
        ...fieldsToUse,
        ...reduceFields(
          field.fieldComponentProps.fieldMap,
          createNestedClientFieldPath(path, field),
          combineLabel(labelPrefix, field),
        ),
      ]
    }

    if (field.type === 'tabs' && 'fieldMap' in field.fieldComponentProps) {
      return [
        ...fieldsToUse,
        ...field.fieldComponentProps.fieldMap.reduce((tabFields, tab) => {
          if ('fieldMap' in tab.fieldComponentProps) {
            return [
              ...tabFields,
              ...reduceFields(
                tab.fieldComponentProps.fieldMap,
                'name' in tab && tab.name ? createNestedClientFieldPath(path, field) : path,
                combineLabel(labelPrefix, field),
              ),
            ]
          }
        }, []),
      ]
    }

    const formattedField = {
      label: combineLabel(labelPrefix, field),
      value: {
        ...field,
        path: createNestedClientFieldPath(path, field),
      },
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

export const FieldSelect: React.FC<Props> = ({ fieldMap, setSelected }) => {
  const { t } = useTranslation()
  const [options] = useState(() => reduceFields(fieldMap))

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
      <Label label={t('fields:selectFieldsToEdit')} />
      <ReactSelect isMulti onChange={handleChange} options={options} />
    </div>
  )
}
