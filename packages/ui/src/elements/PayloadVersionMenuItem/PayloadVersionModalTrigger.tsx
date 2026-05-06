'use client'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Client component imports from same package's client bundle
import { Drawer, PopupList, useModal } from '../../exports/client/index.js'
import { CopyButton } from './CopyButton.js'
import { formatForClipboard } from './formatForClipboard.js'
import { VersionList } from './VersionList.js'
import './index.scss'

const drawerSlug = 'payload-version-info'

export const PayloadVersionModalTrigger: React.FC<{
  versions: Record<string, string>
}> = ({ versions }) => {
  const { openModal } = useModal()
  const payloadVersion = versions.payload ?? '0.0.0'

  return (
    <PopupList.ButtonGroup>
      <PopupList.Button
        className="payload-version-menu-item__button"
        onClick={() => openModal(drawerSlug)}
      >
        {`Payload v${payloadVersion}`}
      </PopupList.Button>
      <Drawer slug={drawerSlug} title="Payload Version Info">
        <div className="payload-version-menu-item__content">
          <VersionList versions={versions} />
          <CopyButton text={formatForClipboard(versions)} />
        </div>
      </Drawer>
    </PopupList.ButtonGroup>
  )
}
