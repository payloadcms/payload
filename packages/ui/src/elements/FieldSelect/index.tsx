'use client'
import type { ClientField, FieldWithPathClient } from 'payload'

import React, { Fragment, useState } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { reduceSelectableFields } from './reduceSelectableFields.js'
import './index.scss'

const baseClass = 'field-select'

export type FieldSelectProps = {
  readonly fields: ClientField[]
  readonly setSelected: (fields: FieldWithPathClient[]) => void
}

export const combineLabel = ({
  CustomLabel,
  field,
  prefix,
}: {
  CustomLabel?: React.ReactNode
  field?: ClientField
  prefix?: React.ReactNode
}): React.ReactNode => {
  return (
    <Fragment>
      {prefix ? (
        <Fragment>
          <span style={{ display: 'inline-block' }}>{prefix}</span>
          {' > '}
        </Fragment>
      ) : null}
      <span style={{ display: 'inline-block' }}>
        <RenderCustomComponent
          CustomComponent={CustomLabel}
          Fallback={<FieldLabel label={'label' in field && field.label} />}
        />
      </span>
    </Fragment>
  )
}

export const FieldSelect: React.FC<FieldSelectProps> = ({ fields, setSelected }) => {
  const { t } = useTranslation()
  const { dispatchFields, getFields } = useForm()

  const [options] = useState(() =>
    reduceSelectableFields({
      fields,
      formState: getFields(),
      parentIndexPath: '',
      parentPath: '',
      parentSchemaPath: '',
    }),
  )

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
