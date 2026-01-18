import { formatAdminURL } from '@ruya.sa/payload/shared'
import React from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Link } from '../../Link/index.js'
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js'
import './index.scss'

const baseClass = 'browse-by-folder-button'

export function BrowseByFolderButton({ active }) {
  const { t } = useTranslation()
  const { config } = useConfig()
  const {
    admin: {
      routes: { browseByFolder: foldersRoute },
    },
    routes: { admin: adminRoute },
  } = config

  return (
    <Link
      className={[baseClass, active && 'active'].filter(Boolean).join(' ')}
      href={formatAdminURL({
        adminRoute,
        path: foldersRoute,
      })}
      id="browse-by-folder"
      prefetch={false}
    >
      <ColoredFolderIcon />
      {t('folder:browseByFolder')}
    </Link>
  )
}
