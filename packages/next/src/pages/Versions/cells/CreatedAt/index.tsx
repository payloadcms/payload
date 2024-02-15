'use client'
import React from 'react'
import { formatDate, useConfig, useTranslation, useTableCell } from '@payloadcms/ui'
import Link from 'next/link'

type CreatedAtCellProps = {
  collectionSlug?: string
  globalSlug?: string
  docID?: string | number
}

export const CreatedAtCell: React.FC<CreatedAtCellProps> = ({
  collectionSlug,
  globalSlug,
  docID,
}) => {
  const {
    routes: { admin },
    admin: { dateFormat },
  } = useConfig()

  const { i18n } = useTranslation()

  const { cellData, rowData } = useTableCell()

  const versionID = rowData.id

  let to: string

  if (collectionSlug) to = `${admin}/collections/${collectionSlug}/${docID}/versions/${versionID}`

  if (globalSlug) to = `${admin}/globals/${globalSlug}/versions/${versionID}`

  return <Link href={to}>{cellData && formatDate(cellData, dateFormat, i18n.language)}</Link>
}
