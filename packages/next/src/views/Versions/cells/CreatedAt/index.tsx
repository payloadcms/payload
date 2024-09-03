'use client'
import { useConfig, useTableCell, useTranslation } from '@payloadcms/ui'
import { formatAdminURL, formatDate } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

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
    config: {
      admin: { dateFormat },
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  const { cellData, rowData } = useTableCell()

  const versionID = rowData.id

  let to: string

  if (collectionSlug) {
    to = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/${docID}/versions/${versionID}`,
    })
  }

  if (globalSlug) {
    to = formatAdminURL({
      adminRoute,
      path: `/globals/${globalSlug}/versions/${versionID}`,
    })
  }

  return (
    <Link href={to}>
      {cellData &&
        formatDate({ date: cellData as Date | number | string, i18n, pattern: dateFormat })}
    </Link>
  )
}
