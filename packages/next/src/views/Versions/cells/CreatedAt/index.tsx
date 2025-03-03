'use client'
import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

type CreatedAtCellProps = {
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
  rowData?: {
    id: number | string
    updatedAt: Date | number | string
  }
}

export const CreatedAtCell: React.FC<CreatedAtCellProps> = ({
  collectionSlug,
  docID,
  globalSlug,
  rowData: { id, updatedAt } = {},
}) => {
  const {
    config: {
      admin: { dateFormat },
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  let to: string

  if (collectionSlug) {
    to = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/${docID}/versions/${id}`,
    })
  }

  if (globalSlug) {
    to = formatAdminURL({
      adminRoute,
      path: `/globals/${globalSlug}/versions/${id}`,
    })
  }

  return (
    <Link href={to} prefetch={false}>
      {formatDate({ date: updatedAt, i18n, pattern: dateFormat })}
    </Link>
  )
}
