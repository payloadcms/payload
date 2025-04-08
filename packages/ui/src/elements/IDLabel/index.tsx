'use client'
import React from 'react'

import './index.scss'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { sanitizeID } from '../../utilities/sanitizeID.js'

const baseClass = 'id-label'

export const IDLabel: React.FC<{ className?: string; id: string; prefix?: string }> = ({
  id,
  className,
  prefix = 'ID:',
}) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const editDepth = useEditDepth()

  const docPath = formatAdminURL({
    adminRoute,
    path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`,
  })

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')} title={id}>
      {prefix}
      &nbsp;
      {editDepth === 0 ? (
        sanitizeID(id)
      ) : (
        <a href={docPath} rel="noopener noreferrer" target="_blank">
          {sanitizeID(id)}
        </a>
      )}
    </div>
  )
}
