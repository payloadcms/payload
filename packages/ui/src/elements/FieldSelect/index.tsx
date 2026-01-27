'use client'
import type { ClientField, FormState, SanitizedFieldPermissions } from 'payload'

import React, { useState } from 'react'

import type { FieldAction } from '../../forms/Form/types.js'
import type { FieldOption } from './reduceFieldOptions.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { filterOutUploadFields } from '../../utilities/filterOutUploadFields.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { reduceFieldOptions } from './reduceFieldOptions.js'
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

export const FieldSelect: React.FC<FieldSelectProps> = ({ fields, onChange, permissions }) => {
  const { t } = useTranslation()
  const { dispatchFields, getFields } = useForm()

  const [options] = useState<FieldOption[]>(() =>
    reduceFieldOptions({
      fields: filterOutUploadFields(fields),
      formState: getFields(),
      permissions,
    }),
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
