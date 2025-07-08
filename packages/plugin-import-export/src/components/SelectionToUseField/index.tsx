'use client'

import {
  RadioGroupField,
  useDocumentInfo,
  useField,
  useListQuery,
  useSelection,
  useTranslation,
} from '@payloadcms/ui'
import React, { useEffect, useMemo } from 'react'

export const SelectionToUseField: React.FC = () => {
  const { id } = useDocumentInfo()
  const { query } = useListQuery()
  const { selectAll, selected } = useSelection()
  const { t } = useTranslation()

  const { setValue: setSelectionToUseValue, value: selectionToUseValue } = useField({
    path: 'selectionToUse',
  })

  const { setValue: setWhere } = useField({
    path: 'where',
  })

  const availableOptions = useMemo(() => {
    const options = [
      {
        // @ts-expect-error - this is not correctly typed in plugins right now
        label: t('plugin-import-export:selectionToUse-allDocuments'),
        value: 'all',
      },
    ]

    if (query?.where) {
      options.unshift({
        // @ts-expect-error - this is not correctly typed in plugins right now
        label: t('plugin-import-export:selectionToUse-currentFilters'),
        value: 'currentFilters',
      })
    }

    if (['allInPage', 'some'].includes(selectAll)) {
      options.unshift({
        // @ts-expect-error - this is not correctly typed in plugins right now
        label: t('plugin-import-export:selectionToUse-currentSelection'),
        value: 'currentSelection',
      })
    }

    return options
  }, [query?.where, selectAll, t])

  // Auto-set default
  useEffect(() => {
    if (id) {
      return
    }

    let defaultSelection: 'all' | 'currentFilters' | 'currentSelection' = 'all'

    if (['allInPage', 'some'].includes(selectAll)) {
      defaultSelection = 'currentSelection'
    } else if (query?.where) {
      defaultSelection = 'currentFilters'
    }

    setSelectionToUseValue(defaultSelection)
  }, [id, selectAll, query?.where, setSelectionToUseValue])

  // Sync where clause with selected option
  useEffect(() => {
    if (id) {
      return
    }

    if (selectionToUseValue === 'currentFilters' && query?.where) {
      setWhere(query.where)
    } else if (selectionToUseValue === 'currentSelection' && selected) {
      const ids = [...selected.entries()].filter(([_, isSelected]) => isSelected).map(([id]) => id)

      setWhere({ id: { in: ids } })
    } else if (selectionToUseValue === 'all') {
      setWhere({})
    }
  }, [id, selectionToUseValue, query?.where, selected, setWhere])

  return (
    <RadioGroupField
      field={{
        name: 'selectionToUse',
        type: 'radio',
        admin: {},
        // @ts-expect-error - this is not correctly typed in plugins right now
        label: t('plugin-import-export:field-selectionToUse-label'),
        options: availableOptions,
      }}
      // @ts-expect-error - this is not correctly typed in plugins right now
      label={t('plugin-import-export:field-selectionToUse-label')}
      options={availableOptions}
      path="selectionToUse"
    />
  )
}
