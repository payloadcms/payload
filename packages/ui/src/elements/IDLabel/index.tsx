'use client'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Link } from '../../elements/Link/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useDrawerDepth } from '../Drawer/index.js'
import './index.css'

const baseClass = 'id-label'

export const IDLabel: React.FC<{
  className?: string
  id: number | string
  prefix?: string
}> = ({ id, className, prefix = 'ID' }) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { collectionSlug, globalSlug } = useDocumentInfo()
  const drawerDepth = useDrawerDepth()

  // Only render as link if we're inside a drawer and have document context
  const shouldRenderLink = drawerDepth > 0 && (collectionSlug || globalSlug)

  const classes = [baseClass, shouldRenderLink && `${baseClass}--is-link`, className]
    .filter(Boolean)
    .join(' ')

  if (shouldRenderLink) {
    const docPath = formatAdminURL({
      adminRoute,
      path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${encodeURIComponent(id)}`,
    })

    return (
      <div className={classes} title={String(id)}>
        <span className={`${baseClass}__prefix`}>{prefix}</span>
        <Link className={`${baseClass}__link`} href={docPath}>
          {id}
        </Link>
      </div>
    )
  }

  return (
    <div className={classes} title={String(id)}>
      <span className={`${baseClass}__prefix`}>{prefix}</span>
      <span className={`${baseClass}__value`}>{id}</span>
    </div>
  )
}
