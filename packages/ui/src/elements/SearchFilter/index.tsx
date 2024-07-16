'use client'
import type { I18nClient, TFunction } from '@payloadcms/translations'

import { getTranslation } from '@payloadcms/translations'
import React, { useEffect, useRef } from 'react'

export type SearchFilterProps = {
  fieldLabel?: string
  fieldName?: string
  handleChange?: (search: string) => void
  i18n?: I18nClient
  initialParams?: ParsedQs
  listSearchableFields?: MappedField[]
  setValue?: (arg: string) => void
  t?: TFunction
  value?: string
}

import type { ParsedQs } from 'qs-esm'

import type { MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'

import { useDebounce } from '../../hooks/useDebounce.js'
import { SearchIcon } from '../../icons/Search/index.js'
import './index.scss'

const baseClass = 'search-filter'

export const SearchFilter: React.FC<SearchFilterProps> = (props) => {
  const {
    fieldLabel = 'ID',
    handleChange,
    i18n,
    initialParams,
    listSearchableFields,
    setValue,
    t,
    value,
  } = props

  const previousSearch = useRef(
    typeof initialParams?.search === 'string' ? initialParams?.search : '',
  )

  const placeholder = useRef(t('general:searchBy', { label: getTranslation(fieldLabel, i18n) }))

  const debouncedSearch = useDebounce(value, 300)

  useEffect(() => {
    if (debouncedSearch !== previousSearch.current) {
      if (handleChange) handleChange(debouncedSearch)

      previousSearch.current = debouncedSearch
    }
  }, [debouncedSearch, previousSearch, handleChange])

  // Cleans up the search input when the component is unmounted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => setValue(''), [])

  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      placeholder.current = listSearchableFields.reduce(
        (placeholderText: string, field, i: number) => {
          const label =
            'fieldComponentProps' in field &&
            'label' in field.fieldComponentProps &&
            field.fieldComponentProps.label
              ? field.fieldComponentProps.label
              : field.name

          if (i === 0) {
            return `${t('general:searchBy', {
              label: getTranslation(label, i18n),
            })}`
          }

          if (i === listSearchableFields.length - 1) {
            return `${placeholderText} ${t('general:or')} ${getTranslation(label, i18n)}`
          }

          return `${placeholderText}, ${getTranslation(label, i18n)}`
        },
        '',
      )
    } else {
      placeholder.current = t('general:searchBy', { label: getTranslation(fieldLabel, i18n) })
    }
  }, [t, listSearchableFields, i18n, fieldLabel])

  return (
    <div className={baseClass}>
      <input
        aria-label={placeholder.current}
        className={`${baseClass}__input`}
        id="search-filter-input"
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder.current}
        type="text"
        value={value || ''}
      />
      <SearchIcon />
    </div>
  )
}
