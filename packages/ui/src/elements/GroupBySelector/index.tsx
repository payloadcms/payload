'use client'
import type { ClientField, SanitizedCollectionConfig } from 'payload'

import './index.scss'

import React, { useMemo } from 'react'

import { SelectInput } from '../../fields/Select/Input.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { ReactSelect } from '../ReactSelect/index.js'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  fields: ClientField[]
}

const baseClass = 'group-by-selector'

export const GroupBySelector: React.FC<Props> = ({ collectionSlug, fields }) => {
  const { i18n, t } = useTranslation()

  const reducedFields = useMemo(() => reduceFieldsToOptions({ fields, i18n }), [fields, i18n])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <p>
          {t('general:groupByLabel', {
            label: '',
          })}
        </p>
        <button className={`${baseClass}__clear-button`} onClick={() => {}} type="button">
          {t('general:clear')}
        </button>
      </div>
      <div className={`${baseClass}__inputs`}>
        <ReactSelect
          // disabled={disabled}
          filterOption={(option, inputValue) =>
            ((option?.data?.plainTextLabel as string) || option.label)
              .toLowerCase()
              .includes(inputValue.toLowerCase())
          }
          isClearable={false}
          // onChange={handleFieldChange}
          options={reducedFields.filter((field) => !field.field.admin.disableListFilter)}
          // value={
          //   reducedField || {
          //     value: reducedField?.value,
          //   }
          // }
        />
        <SelectInput
          name="direction"
          options={[
            { label: t('general:ascending'), value: 'asc' },
            { label: t('general:descending'), value: 'desc' },
          ]}
          path="direction"
        />
      </div>
    </div>
  )
}
