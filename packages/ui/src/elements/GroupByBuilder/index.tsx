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

  const groupByFieldName = query.groupBy?.replace(/^-/, '')

  const groupByField = reducedFields.find((field) => field.value === groupByFieldName)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <p>
          {t('general:groupByLabel', {
            label: '',
          })}
        </p>
        {query.groupBy && (
          <button
            className={`${baseClass}__clear-button`}
            id="group-by--reset"
            onClick={async () => {
              await refineListData({
                groupBy: undefined,
              })
            }}
            type="button"
          >
            {t('general:clear')}
          </button>
        )}
      </div>
      <div className={`${baseClass}__inputs`}>
        <ReactSelect
          filterOption={(option, inputValue) =>
            ((option?.data?.plainTextLabel as string) || option.label)
              .toLowerCase()
              .includes(inputValue.toLowerCase())
          }
          id="group-by--field-select"
          isClearable
          isMulti={false}
          onChange={async (v: { value: string } | null) => {
            const value = v === null ? undefined : v.value

            await refineListData({
              groupBy: query.groupBy?.startsWith('-') ? `-${value}` : value,
              page: '1',
            })
          }}
          options={reducedFields.filter(
            (field) => !field.field.admin.disableListFilter && field.value !== 'id',
          )}
          value={{
            label: groupByField?.label || t('general:selectValue'),
            value: groupByFieldName || '',
          }}
        />
        <SelectInput
          id="group-by--sort"
          isClearable={false}
          name="direction"
          onChange={async ({ value }: { value: string }) => {
            await refineListData({
              groupBy: value === 'asc' ? groupByFieldName : `-${groupByFieldName}`,
              page: '1',
            })
          }}
          options={[
            { label: t('general:ascending'), value: 'asc' },
            { label: t('general:descending'), value: 'desc' },
          ]}
          path="direction"
          value={
            !query.groupBy
              ? 'asc'
              : typeof query.groupBy === 'string'
                ? `${query.groupBy.startsWith('-') ? 'desc' : 'asc'}`
                : ''
          }
        />
      </div>
    </div>
  )
}
