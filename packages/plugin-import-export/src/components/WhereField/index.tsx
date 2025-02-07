'use client'

import type React from 'react'

import { useField, useListQuery } from '@payloadcms/ui'
import { useEffect } from 'react'

import './index.scss'
import { useImportExport } from '../ImportExportProvider/index.js'

export const WhereField: React.FC = () => {
  const { value: selectionToUseValue } = useField({ path: 'selectionToUse' })
  const { setValue } = useField({ path: 'where' })
  const { selected } = useImportExport()
  const { query } = useListQuery()

  // setValue based on selectionToUseValue
  useEffect(() => {
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
  }, [selectionToUseValue, query, selected, setValue])

  return null
}
