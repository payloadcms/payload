'use client'
import type { ClientField, Field, SanitizedCollectionConfig } from 'payload'

import './index.scss'

import React, { useMemo } from 'react'

import { SelectInput } from '../../fields/Select/Input.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { ReactSelect } from '../ReactSelect/index.js'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  fields: ClientField[]
}

const baseClass = 'group-by-builder'

/**
 * Note: Some fields are already omitted from the list of fields:
 * - fields with nested field, e.g. `tabs`, `groups`, etc.
 * - fields that don't affect data, i.e. `row`, `collapsible`, `ui`, etc.
 * So we don't technically need to omit them here, but do anyway.
 * But some remaining fields still need an additional check, e.g. `richText`, etc.
 */
const supportedFieldTypes: Field['type'][] = [
  'text',
  'textarea',
  'number',
  'select',
  'relationship',
  'date',
  'checkbox',
  'radio',
  'email',
  'number',
  'upload',
]

export const GroupByBuilder: React.FC<Props> = ({ collectionSlug, fields }) => {
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()

  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields

  const reducedFields = useMemo(
    () =>
      reduceFieldsToOptions({
        fieldPermissions,
        fields,
        i18n,
      }),
    [fields, fieldPermissions, i18n],
  )

  const { query, setQuery } = useListQuery()

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
            onClick={() => {
              setQuery({ groupBy: null })
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
          onChange={(v: { value: string } | null) => {
            if (v === null) {
              setQuery({ groupBy: null, page: 1 })
              return
            }

            const value = v.value
            setQuery({
              groupBy: query.groupBy?.startsWith('-') ? `-${value}` : value,
              page: 1,
            })
          }}
          options={reducedFields.filter(
            (field) =>
              !field.field.admin.disableGroupBy &&
              field.value !== 'id' &&
              supportedFieldTypes.includes(field.field.type),
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
          onChange={({ value }: { value: string }) => {
            if (!groupByFieldName) {
              return
            }

            setQuery({
              groupBy: value === 'asc' ? groupByFieldName : `-${groupByFieldName}`,
              page: 1,
            })
          }}
          options={[
            { label: t('general:ascending'), value: 'asc' },
            { label: t('general:descending'), value: 'desc' },
          ]}
          path="direction"
          readOnly={!groupByFieldName}
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
