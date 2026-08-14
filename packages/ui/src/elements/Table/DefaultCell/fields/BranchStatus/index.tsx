'use client'
import type { DefaultCellComponentProps, SelectFieldClient } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.css'

/**
 * A branch's lifecycle state, rendered like a document's draft/published status.
 *
 * Reuses the `status-cell` look deliberately: a branch's status answers the same
 * kind of question a document's does — is this live, is it still being worked on —
 * so two visual languages for it in the same list view would be noise. It cannot
 * reuse `StatusCell` itself, which keys its colours off `_status`'s own values.
 */
export const BranchStatusCell: React.FC<DefaultCellComponentProps<SelectFieldClient>> = ({
  cellData,
}) => {
  const { t } = useTranslation()

  if (!cellData) {
    return null
  }

  const status = String(Array.isArray(cellData) ? cellData[0] : cellData)

  const label = {
    closed: t('branching:status_closed'),
    merged: t('branching:status_merged'),
    merging: t('branching:status_merging'),
    open: t('branching:status_open'),
  }[status]

  return (
    <span className={`status-cell branch-status-cell branch-status-cell--${status}`}>
      <span className="status-cell__label">{label ?? status}</span>
    </span>
  )
}
