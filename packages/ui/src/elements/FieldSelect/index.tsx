'use client'
import type {
  ClientField,
  FieldWithPathClient,
  FormState,
  SanitizedFieldPermissions,
} from 'payload'

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsHiddenOrDisabled,
  getFieldPermissions,
} from 'payload/shared'
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
  readonly permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
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
  parentPath = '',
  path = '',
  permissions,
}: {
  readonly fields: ClientField[]
  readonly formState?: FormState
  readonly labelPrefix?: React.ReactNode
  readonly parentPath?: string
  readonly path?: string
  readonly permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
}): FieldOption[] => {
  if (!fields) {
    return []
  }

  const CustomLabel = formState?.[path]?.customComponents?.Label

  return fields?.reduce((fieldsToUse, field) => {
    const {
      operation: hasOperationPermission,
      permissions: fieldPermissions,
      read: hasReadPermission,
    } = getFieldPermissions({
      field,
      operation: 'update',
      parentName: parentPath?.includes('.')
        ? parentPath.split('.')[parentPath.split('.').length - 1]
        : parentPath,
      permissions,
    })

    // escape for a variety of reasons, include ui fields as they have `name`.
    if (
      (fieldAffectsData(field) || field.type === 'ui') &&
      (field.admin?.disableBulkEdit ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly) ||
        !hasOperationPermission ||
        !hasReadPermission)
    ) {
      return fieldsToUse
    }

    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFields({
          fields: field.fields,
          labelPrefix: combineLabel({ CustomLabel, field, prefix: labelPrefix }),
          parentPath: path,
          path: createNestedClientFieldPath(path, field),
          permissions: fieldPermissions,
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
                parentPath: path,
                path: isNamedTab ? createNestedClientFieldPath(path, field) : path,
                permissions: isNamedTab ? fieldPermissions[tab.name] : fieldPermissions,
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

export const FieldSelect: React.FC<FieldSelectProps> = ({ fields, onChange, permissions }) => {
  const { t } = useTranslation()
  const { dispatchFields, getFields } = useForm()

  const [options] = useState<FieldOption[]>(() =>
    reduceFields({ fields: filterOutUploadFields(fields), formState: getFields(), permissions }),
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
