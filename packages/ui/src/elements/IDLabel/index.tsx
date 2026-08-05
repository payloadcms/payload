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
  /** Set when the label is already wrapped in a link by a parent, e.g. a linked list view cell. */
  isLink?: boolean
  prefix?: string
}> = ({ id, className, isLink, prefix = 'ID' }) => {
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

  const classes = [baseClass, (isLink || shouldRenderLink) && `${baseClass}--is-link`, className]
    .filter(Boolean)
    .join(' ')

  if (shouldRenderLink) {
    const docPath = formatAdminURL({
      adminRoute,
      path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`,
    })

    return (
      <div className={classes} title={String(id)}>
        <span className={`${baseClass}__prefix`}>{prefix}</span>
        <Link className={`${baseClass}__link`} href={docPath}>
          {sanitizedID}
        </Link>
      </div>
    )
  }

  return (
    <div className={classes} title={String(id)}>
      <span className={`${baseClass}__prefix`}>{prefix}</span>
      <span className={`${baseClass}__value`}>{sanitizedID}</span>
    </div>
  )
}
