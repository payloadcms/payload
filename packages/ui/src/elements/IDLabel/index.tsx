'use client'
import { useModal } from '@faceless-ui/modal'
import React from 'react'

import './index.scss'
import { Link } from '../../elements/Link/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { sanitizeID } from '../../utilities/sanitizeID.js'
import { useDocumentDrawerContext } from '../DocumentDrawer/Provider.js'
import { useDrawerDepth } from '../Drawer/index.js'

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
  const drawerDepth = useDrawerDepth()
  const { drawerSlug } = useDocumentDrawerContext()
  const { closeModal } = useModal()

  const docPath = formatAdminURL({
    adminRoute,
    path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`,
  })

  const onClick = React.useCallback(() => {
    if (drawerSlug) {
      closeModal(drawerSlug)
    }
  }, [drawerSlug, closeModal])

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')} title={id}>
      {prefix}
      &nbsp;
      {drawerDepth > 1 ? (
        <Link href={docPath} onClick={onClick}>
          {sanitizeID(id)}
        </Link>
      ) : (
        sanitizeID(id)
      )}
    </div>
  )
}
