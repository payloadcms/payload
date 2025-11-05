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
  const { closeModal, modalState } = useModal()

  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { drawerSlug } = useDocumentDrawerContext()
  const drawerDepth = useDrawerDepth()

  const docPath = formatAdminURL({
    adminRoute,
    path: `/${collectionSlug ? `collections/${collectionSlug}` : `globals/${globalSlug}`}/${id}`,
  })

  const handleCloseDrawer = () => {
    if (drawerSlug && !!modalState[drawerSlug]?.isOpen) {
      closeModal(drawerSlug)
    }
  }

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')} title={id}>
      {prefix}
      &nbsp;
      {drawerDepth > 1 ? (
        <Link href={docPath} onClick={handleCloseDrawer}>
          {sanitizeID(id)}
        </Link>
      ) : (
        sanitizeID(id)
      )}
    </div>
  )
}
