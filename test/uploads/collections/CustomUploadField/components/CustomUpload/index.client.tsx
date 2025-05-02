'use client'

import { Drawer, DrawerToggler, TextField, Upload, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

const customDrawerSlug = 'custom-upload-drawer'

const CustomDrawer = () => {
  return (
    <Drawer slug={customDrawerSlug}>
      <h1>Custom Drawer</h1>
      <TextField
        field={{
          name: 'alt',
          label: 'Alt',
        }}
        path="alt"
      />
    </Drawer>
  )
}

const CustomDrawerToggler = () => {
  return (
    <React.Fragment>
      <DrawerToggler slug={customDrawerSlug}>Custom Drawer</DrawerToggler>
      <CustomDrawer />
    </React.Fragment>
  )
}

export const CustomUploadClient = () => {
  const { collectionSlug, docConfig, initialState } = useDocumentInfo()

  return (
    <div>
      <h3>This text was rendered on the client</h3>
      <Upload
        collectionSlug={collectionSlug}
        customActions={[<CustomDrawerToggler key={0} />]}
        initialState={initialState}
        uploadConfig={'upload' in docConfig ? docConfig.upload : undefined}
      />
      <h4>
        And that{' '}
        <span aria-label="point up" role="img">
          👆
        </span>{' '}
        is re-used from payload components
      </h4>
    </div>
  )
}
