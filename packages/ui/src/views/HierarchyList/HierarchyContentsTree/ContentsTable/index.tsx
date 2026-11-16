'use client'

import React from 'react'

import type { SelectionDocument } from '../../../../providers/DocumentSelection/types.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import { ContentsSelectAll } from '../ContentsSelectAll/index.js'

export function ContentsTable({
  children,
  documents,
  hasRowSelections,
  hasSelectAll,
  label,
}: {
  children: React.ReactNode
  documents: SelectionDocument[]
  hasRowSelections: boolean
  hasSelectAll: boolean
  label: string
}) {
  const { t } = useTranslation()

  return (
    <div className="table table--nested-docs">
      <table aria-label={label} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            {hasRowSelections && (
              <th data-column="_select" scope="col">
                {hasSelectAll ? (
                  <ContentsSelectAll documents={documents} />
                ) : (
                  <span className="sr-only">
                    {t('general:selectLabel', { label: t('general:document') })}
                  </span>
                )}
              </th>
            )}
            <th scope="col">{t('general:name')}</th>
            <th scope="col">{t('version:type')}</th>
            <th scope="col">{t('general:updatedAt')}</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
