'use client'

import React from 'react'

import type { SlotColumn } from './SlotTable.js'
import type { TableRow } from './types.js'

import { useTranslation } from '../../../providers/Translation/index.js'

function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export const DateCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { i18n } = useTranslation()

  if (!row.updatedAt || typeof row.updatedAt !== 'string') {
    return <span>—</span>
  }

  return <span>{formatDate(String(row.updatedAt), i18n.language)}</span>
}
