'use client'
import type { ClientField, SanitizedCollectionConfig } from 'payload'

import './index.scss'

import React, { useMemo } from 'react'

import { SelectInput } from '../../fields/Select/Input.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { ReactSelect } from '../ReactSelect/index.js'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  fields: ClientField[]
}

const baseClass = 'group-by-builder'

export const GroupByBuilder: React.FC<Props> = ({ collectionSlug, fields }) => {
  const { i18n, t } = useTranslation()

  const reducedFields = useMemo(() => reduceFieldsToOptions({ fields, i18n }), [fields, i18n])

  const { query, refineListData } = useListQuery()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <p>
          {t('general:groupByLabel', {
            label: '',
          })}
        </p>
        <button
          className={`${baseClass}__clear-button`}
          onClick={async () => {
            await refineListData({
              groupBy: undefined,
              sort: undefined,
            })
          }}
          type="button"
        >
          {t('general:clear')}
        </button>
      </div>
      <div className={`${baseClass}__inputs`}>
        <ReactSelect
          filterOption={(option, inputValue) =>
            ((option?.data?.plainTextLabel as string) || option.label)
              .toLowerCase()
              .includes(inputValue.toLowerCase())
          }
          id="group-by--field-select"
          isClearable={false}
          isMulti={false}
          // disabled={disabled}
          onChange={async ({ value }: { value: string }) => {
            await refineListData({ groupBy: value, sort: undefined })
          }}
          options={reducedFields.filter((field) => !field.field.admin.disableListFilter)}
          value={{
            label:
              reducedFields.find((field) => field.value === query.groupBy)?.label ||
              t('general:selectValue'),
            value: query.groupBy || '',
          }}
        />
        <SelectInput
          id="group-by--direction-select"
          name="direction"
          onChange={async ({ value }: { value: string }) => {
            await refineListData({
              sort:
                value === 'asc'
                  ? query.groupBy?.replace(/^-/, '')
                  : `-${query.groupBy?.replace(/^-/, '')}`,
            })
          }}
          options={[
            { label: t('general:ascending'), value: 'asc' },
            { label: t('general:descending'), value: 'desc' },
          ]}
          path="direction"
          value={
            !query.sort
              ? 'asc'
              : typeof query.sort === 'string'
                ? `${query.sort.startsWith('-') ? 'desc' : 'asc'}`
                : ''
          }
        />
      </div>
    </div>
  )
}
