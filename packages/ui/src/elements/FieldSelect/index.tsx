'use client'
import type { ClientField, FieldWithPathClient, FormState } from 'payload'

import { fieldAffectsData, fieldHasSubFields, fieldIsHiddenOrDisabled } from 'payload/shared'
import React, { Fragment, useState } from 'react'

import type { FieldAction } from '../../forms/Form/types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/context.js'
import { createNestedClientFieldPath } from '../../forms/Form/createNestedClientFieldPath.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { filterOutUploadFields } from '../../utilities/filterOutUploadFields.js'
import { ReactSelect } from '../ReactSelect/index.js'
import './index.scss'

const baseClass = 'field-select'

export type OnFieldSelect = ({
  dispatchFields,
  formState,
  selected,
}: {
  dispatchFields: React.Dispatch<FieldAction>
  formState: FormState
  selected: FieldOption[]
}) => void

export type FieldSelectProps = {
  readonly fields: ClientField[]
  readonly onChange: OnFieldSelect
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

export type FieldOption = { Label: React.ReactNode; value: FieldWithPathClient }

const reduceFields = ({
  fields,
  formState,
  labelPrefix = null,
  path = '',
}: {
  fields: ClientField[]
  formState?: FormState
  labelPrefix?: React.ReactNode
  path?: string
}): FieldOption[] => {
  if (!fields) {
    return []
  }

  const CustomLabel = formState?.[path]?.customComponents?.Label

  return fields?.reduce((fieldsToUse, field) => {
    // escape for a variety of reasons, include ui fields as they have `name`.
    if (
      (fieldAffectsData(field) || field.type === 'ui') &&
      (field.admin?.disableBulkEdit ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly))
    ) {
      return fieldsToUse
    }

    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFields({
          fields: field.fields,
          labelPrefix: combineLabel({ CustomLabel, field, prefix: labelPrefix }),
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
      label: combineLabel({ CustomLabel, field, prefix: labelPrefix }),
      value: {
        ...field,
        path: createNestedClientFieldPath(path, field),
      },
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

export const FieldSelect: React.FC<FieldSelectProps> = ({ fields, onChange }) => {
  const { t } = useTranslation()
  const { dispatchFields, getFields } = useForm()

  const [options] = useState<FieldOption[]>(() =>
    reduceFields({ fields: filterOutUploadFields(fields), formState: getFields() }),
  )

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
        onChange={(selected: FieldOption[]) =>
          onChange({ dispatchFields, formState: getFields(), selected })
        }
        options={options}
      />
    </div>
  )
}
