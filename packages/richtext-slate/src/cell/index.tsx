'use client'
import type { DefaultCellComponentProps } from 'payload'

import { useConfig, useTableCell } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const RichTextCell: React.FC<DefaultCellComponentProps<any[]>> = () => {
  const { cellData, cellProps, columnIndex, customCellContext, rowData } = useTableCell()
  const flattenedText = cellData?.map((i) => i?.children?.map((c) => c.text)).join(' ')

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { link } = cellProps || {}
  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    href?: string
    onClick?: () => void
    type?: 'button'
  } = {}

  const isLink = link !== undefined ? link : columnIndex === 0

  if (isLink) {
    WrapElement = Link
    wrapElementProps.href = customCellContext?.collectionSlug
      ? formatAdminURL({
          adminRoute,
          path: `/collections/${customCellContext?.collectionSlug}/${rowData.id}`,
        })
      : ''
  }

  if (isLink) {
    return <WrapElement {...wrapElementProps}>{flattenedText}</WrapElement>
  }
  // Limiting the number of characters shown is done in a CSS rule
  return <span>{flattenedText}</span>
}
