'use client'

import type React from 'react'

import { useDocumentInfo, useField, useListQuery, useSelection } from '@payloadcms/ui'
import { useEffect } from 'react'

import './index.scss'

export const WhereField: React.FC = () => {
  const { setValue: setSelectionToUseValue, value: selectionToUseValue } = useField({
    path: 'selectionToUse',
  })
  const { setValue } = useField({ path: 'where' })
  const { selectAll, selected } = useSelection()
  const { query } = useListQuery()
  const { id } = useDocumentInfo()

  // setValue based on selectionToUseValue
  useEffect(() => {
    if (id) {
      return
    }

    if (selectionToUseValue === 'currentFilters' && query && query?.where) {
      setValue(query.where)
    }

    if (selectionToUseValue === 'currentSelection' && selected) {
      const ids = []

      for (const [key, value] of selected) {
        if (value) {
          ids.push(key)
        }
      }

      setValue({
        id: {
          in: ids,
        },
      })
    }

    if (selectionToUseValue === 'all' && selected) {
      setValue({})
    }

    // Selected set a where query with IDs
  }, [id, selectionToUseValue, query, selected, setValue])

  // handles default value of selectionToUse
  useEffect(() => {
    if (id) {
      return
    }
    let defaultSelection: 'all' | 'currentFilters' | 'currentSelection' = 'all'

    if (['allInPage', 'some'].includes(selectAll)) {
      defaultSelection = 'currentSelection'
    }

    if (defaultSelection === 'all' && query?.where) {
      defaultSelection = 'currentFilters'
    }

    setSelectionToUseValue(defaultSelection)
  }, [id, query, selectAll, setSelectionToUseValue])

  return null
}
