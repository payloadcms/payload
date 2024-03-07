'use client'
import { formatDate, useConfig, useTableCell, useTranslation } from '@payloadcms/ui'
import LinkDefault from 'next/link.js'
import React from 'react'

const Link = LinkDefault.default

type CreatedAtCellProps = {
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
}

export const CreatedAtCell: React.FC<CreatedAtCellProps> = ({
  collectionSlug,
  docID,
  globalSlug,
}) => {
  const {
    admin: { dateFormat },
    routes: { admin },
  } = useConfig()

  const { i18n } = useTranslation()

  const { cellData, rowData } = useTableCell()

  const versionID = rowData.id

  let to: string

  if (collectionSlug) to = `${admin}/collections/${collectionSlug}/${docID}/versions/${versionID}`

  if (globalSlug) to = `${admin}/globals/${globalSlug}/versions/${versionID}`

  return <Link href={to}>{cellData && formatDate(cellData, dateFormat, i18n.language)}</Link>
}
