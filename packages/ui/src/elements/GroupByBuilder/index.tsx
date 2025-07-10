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

  const groupByWithoutLeadingHyphen = query.groupBy?.startsWith('-')
    ? query.groupBy.slice(1)
    : query.groupBy

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
          filterOption={(option, inputValue) =>
            ((option?.data?.plainTextLabel as string) || option.label)
              .toLowerCase()
              .includes(inputValue.toLowerCase())
          }
          isClearable={false}
          isMulti={false}
          // disabled={disabled}
          onChange={async ({ value }: { value: string }) => {
            await refineListData({ groupBy: query.groupBy?.startsWith('-') ? `-${value}` : value })
          }}
          options={reducedFields.filter((field) => !field.field.admin.disableListFilter)}
          value={{
            label:
              reducedFields.find((field) => field.value === groupByWithoutLeadingHyphen)?.label ||
              '',
            value: query.groupBy || '',
          }}
        />
        <SelectInput
          name="direction"
          onChange={async ({ value }: { value: string }) => {
            await refineListData({
              groupBy:
                value === 'asc' ? groupByWithoutLeadingHyphen : `-${groupByWithoutLeadingHyphen}`,
            })
          }}
          options={[
            { label: t('general:ascending'), value: 'asc' },
            { label: t('general:descending'), value: 'desc' },
          ]}
          path="direction"
          value={query.groupBy?.startsWith('-') ? 'desc' : 'asc'}
        />
      </div>
    </div>
  )
}
