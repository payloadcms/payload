'use client'
// import { Popup, PopupList, useModal } from '@payloadcms/ui'

import './index.scss'

import React from 'react'

import { Dots } from '../Dots/index.js'

const baseClass = 'export-controls'
export const ExportButton: React.FC<{}> = () => {
  // const { toggleModal } = useModal()

  // get collection slug from url
  const collectionSlug = window.location.pathname.split('/')[2]

  const exportDrawerSlug = `export-drawer-${collectionSlug}`

  return (
    <div className={baseClass}>
      EXPORT
      {/* <Popup
        button={<Dots />}
        className={`${baseClass}__popup`}
        horizontalAlign="right"
        size="large"
        verticalAlign="bottom"
      >
        <PopupList.ButtonGroup>
          <PopupList.Button onClick={() => toggleModal(exportDrawerSlug)}>Export</PopupList.Button>
        </PopupList.ButtonGroup>
      </Popup> */}
    </div>
  )
}
