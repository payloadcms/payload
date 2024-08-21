'use client'

import { reduceFieldsToValues } from 'payload/shared'
import React from 'react'

import { DocumentInfoProvider } from '../../../providers/DocumentInfo/index.js'
import { ActionsBar } from '../ActionsBar/index.js'
import { EditForm } from '../EditForm/index.js'
import { FileSidebar } from '../FileSidebar/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { DrawerHeader } from '../Header/index.js'
import './index.scss'

const baseClass = 'bulk-upload--file-manager'

export function AddingFilesView() {
  const {
    activeIndex,
    collectionSlug,
    docPermissions,
    forms,
    hasPublishPermission,
    hasSavePermission,
    hasSubmitted,
  } = useFormsManager()
  const activeForm = forms[activeIndex]

  return (
    <div className={baseClass}>
      <FileSidebar />

      <div className={`${baseClass}__editView`}>
        <DrawerHeader title="File Manager" />
        <DocumentInfoProvider
          collectionSlug={collectionSlug}
          docPermissions={docPermissions}
          hasPublishPermission={hasPublishPermission}
          hasSavePermission={hasSavePermission}
          id={null}
          initialData={reduceFieldsToValues(activeForm.formState, true)}
          initialState={activeForm.formState}
          key={`${activeIndex}-${forms.length}`}
        >
          <ActionsBar />
          <EditForm submitted={hasSubmitted} />
        </DocumentInfoProvider>
      </div>
    </div>
  )
}
