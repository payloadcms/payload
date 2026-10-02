'use client'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Link } from '../../elements/Link/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { sanitizeID } from '../../utilities/sanitizeID.js'
import { useDrawerDepth } from '../Drawer/index.js'
import './index.css'

const baseClass = 'id-label'

export const IDLabel: React.FC<{
  className?: string
  id: number | string
  prefix?: string
  variant?: 'inline' | 'title'
}> = ({ id, className, prefix = 'ID', variant = 'inline' }) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { collectionSlug, globalSlug } = useDocumentInfo()
  const drawerDepth = useDrawerDepth()

  const sanitizedID = sanitizeID(id)

  // Only render as link if we're inside a drawer and have document context
  const shouldRenderLink = drawerDepth > 0 && (collectionSlug || globalSlug)

  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    shouldRenderLink && `${baseClass}--is-link`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (shouldRenderLink) {
    const docPath = formatAdminURL({
      adminRoute,
      path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`,
    })

    return (
      <span className={classes} title={String(id)}>
        {variant === 'title' && <span className={`${baseClass}__prefix`}>{prefix}</span>}
        <Link className={`${baseClass}__link`} href={docPath}>
          {sanitizedID}
        </Link>
      </span>
    )
  }

  return (
    <span className={classes} title={String(id)}>
      {variant === 'title' && <span className={`${baseClass}__prefix`}>{prefix}</span>}
      <span className={`${baseClass}__value`}>{sanitizedID}</span>
    </span>
  )
}
