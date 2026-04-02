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
  readonly fields: ClientField[]
  /** When set, GroupByBuilder is controlled by the form (value + onChange) instead of list query. */
  readonly onChange?: (groupBy: string) => void
  readonly value?: string
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

export const GroupByBuilder: React.FC<Props> = ({
  collectionSlug,
  fields,
  onChange,
  value: valueProp,
}) => {
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const listQuery = useListQuery()

  const isFormMode = typeof onChange === 'function'
  const groupByRaw = isFormMode ? valueProp : listQuery.query?.groupBy
  const groupByFieldName = groupByRaw?.replace(/^-/, '')

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

  const groupByField = reducedFields.find((field) => field.value === groupByFieldName)

  const handleFieldChange = useMemo(() => {
    if (isFormMode) {
      return (v: { value: string } | null) => {
        const value = v === null ? undefined : v.value
        const newGroupBy = value ? (groupByRaw?.startsWith('-') ? `-${value}` : value) : ''
        onChange?.(newGroupBy)
      }
    }
    return (v: { value: string } | null) => {
      void (async () => {
        if (typeof listQuery.refineListData !== 'function') {
          return
        }
        const value = v === null ? undefined : v.value
        if (v === null) {
          await listQuery.refineListData({ groupBy: '', page: 1 })
        } else {
          await listQuery.refineListData({
            groupBy: value
              ? listQuery.query?.groupBy?.startsWith('-')
                ? `-${value}`
                : value
              : undefined,
            page: 1,
          })
        }
      })()
    }
  }, [isFormMode, groupByRaw, listQuery, onChange])

  const handleClear = useMemo(() => {
    if (isFormMode) {
      return () => onChange?.('')
    }
    return () => {
      void (async () => {
        if (typeof listQuery.refineListData === 'function') {
          await listQuery.refineListData({ groupBy: '' })
        }
      })()
    }
  }, [isFormMode, listQuery, onChange])

  const handleDirectionChange = useMemo(() => {
    if (isFormMode) {
      return ({ value }: { value: string }) => {
        if (!groupByFieldName) {
          return
        }
        onChange?.(value === 'asc' ? groupByFieldName : `-${groupByFieldName}`)
      }
    }
    return ({ value }: { value: string }) => {
      void (async () => {
        if (!groupByFieldName || typeof listQuery.refineListData !== 'function') {
          return
        }
        await listQuery.refineListData({
          groupBy: value === 'asc' ? groupByFieldName : `-${groupByFieldName}`,
          page: 1,
        })
      })()
    }
  }, [groupByFieldName, isFormMode, listQuery, onChange])

  const directionValue =
    !groupByRaw || typeof groupByRaw !== 'string'
      ? 'asc'
      : groupByRaw.startsWith('-')
        ? 'desc'
        : 'asc'

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <p>
          {t('general:groupByLabel', {
            label: '',
          })}
        </p>
        {groupByRaw && (
          <button
            className={`${baseClass}__clear-button`}
            id="group-by--reset"
            onClick={() => void handleClear()}
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
          onChange={handleFieldChange}
          options={reducedFields.filter(
            (field) =>
              !field.field.admin?.disableGroupBy &&
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
          onChange={handleDirectionChange}
          options={[
            { label: t('general:ascending'), value: 'asc' },
            { label: t('general:descending'), value: 'desc' },
          ]}
          path="direction"
          readOnly={!groupByFieldName}
          value={directionValue}
        />
      </div>
    </div>
  )
}
