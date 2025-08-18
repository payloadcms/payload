import type { DefaultServerCellComponentProps, Payload } from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { Link } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

export const RscEntrySlateCell: React.FC<
  {
    i18n: I18nClient
    payload: Payload
  } & DefaultServerCellComponentProps
> = (props) => {
  const {
    cellData,
    className: classNameFromProps,
    collectionConfig,
    field: { admin },
    field,
    i18n,
    link,
    onClick: onClickFromProps,
    payload,
    rowData,
  } = props

  const classNameFromConfigContext = admin && 'className' in admin ? admin.className : undefined

  const className =
    classNameFromProps ||
    (field.admin && 'className' in field.admin ? field.admin.className : null) ||
    classNameFromConfigContext
  const adminRoute = payload.config.routes.admin

  const onClick = onClickFromProps

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    href?: string
    onClick?: () => void
    prefetch?: false
    type?: 'button'
  } = {
    className,
  }

  if (link) {
    wrapElementProps.prefetch = false
    WrapElement = Link
    wrapElementProps.href = collectionConfig?.slug
      ? formatAdminURL({
          adminRoute,
          path: `/collections/${collectionConfig?.slug}/${rowData.id}`,
        })
      : ''
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        collectionSlug: collectionConfig?.slug,
        rowData,
      })
    }
  }

  let textContent = ''

  if (cellData) {
    textContent = cellData?.map((i) => i?.children?.map((c) => c.text)).join(' ')
  }

  if (!cellData || !textContent?.length) {
    textContent = i18n.t('general:noLabel', {
      label: getTranslation(('label' in field ? field.label : null) || 'data', i18n),
    })
  }

  return <WrapElement {...wrapElementProps}>{textContent}</WrapElement>
}
