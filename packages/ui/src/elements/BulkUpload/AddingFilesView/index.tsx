'use client'

import { useModal } from '@faceless-ui/modal'
import { reduceFieldsToValues } from 'payload/shared'
import React from 'react'

import { PlusIcon } from '../../../icons/Plus/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { DocumentInfoProvider } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { DialogHeader } from '../../Dialog/DialogHeader/index.js'
import { DialogModal } from '../../Dialog/DialogModal/index.js'
import { ActionsBar } from '../ActionsBar/index.js'
import { AddFilesView } from '../AddFilesView/index.js'
import { discardBulkUploadModalSlug, DiscardWithoutSaving } from '../DiscardWithoutSaving/index.js'
import { EditForm } from '../EditForm/index.js'
import { EditManyBulkUploads } from '../EditMany/index.js'
import { FileSidebar } from '../FileSidebar/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import './index.css'

const baseClass = 'bulk-upload--file-manager'

const addMoreFilesModalSlug = 'bulk-upload-modal--add-more-files'

type Props = {
  readonly modalSlug: string
}

export function AddingFilesView({ modalSlug }: Props) {
  const {
    activeIndex,
    addFiles,
    collectionSlug,
    docPermissions,
    documentSlots,
    forms,
    hasPublishPermission,
    hasSavePermission,
    hasSubmitted,
    resetUploadEdits,
    updateUploadEdits,
  } = useFormsManager()
  const activeForm = forms[activeIndex]
  const { getEntityConfig } = useConfig()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { closeModal, openModal } = useModal()

  const handleAddFiles = React.useCallback(
    (filelist: FileList) => {
      void addFiles(filelist)
      closeModal(addMoreFilesModalSlug)
    },
    [addFiles, closeModal],
  )

  const collectionConfig = getEntityConfig({ collectionSlug })

  return (
    <>
      <DialogModal className="bulk-upload--dialog" size="large" slug={modalSlug}>
        <DialogHeader
          onClose={() => openModal(discardBulkUploadModalSlug)}
          showClose={true}
          title={t('upload:bulkUpload')}
        >
          <div className={`${baseClass}__header-actions`}>
            <Button
              buttonStyle="secondary"
              icon={<PlusIcon size={24} />}
              iconPosition="left"
              onClick={() => openModal(addMoreFilesModalSlug)}
            >
              {t('upload:addFiles')}
            </Button>

            <EditManyBulkUploads collection={collectionConfig} />
          </div>
        </DialogHeader>

        <div className={`${baseClass}__wrapper`}>
          <div className={baseClass}>
            <FileSidebar />

            <div className={`${baseClass}__editView`}>
              {activeForm ? (
                <DocumentInfoProvider
                  collectionSlug={collectionSlug}
                  currentEditor={user}
                  docPermissions={docPermissions}
                  hasPublishedDoc={false}
                  hasPublishPermission={hasPublishPermission}
                  hasSavePermission={hasSavePermission}
                  id={null}
                  initialData={reduceFieldsToValues(activeForm.formState, true)}
                  initialState={activeForm.formState}
                  isLocked={false}
                  key={`${activeIndex}-${forms.length}`}
                  lastUpdateTime={0}
                  mostRecentVersionIsAutosaved={false}
                  unpublishedVersionCount={0}
                  Upload={documentSlots.Upload}
                  versionCount={0}
                >
                  <EditForm
                    resetUploadEdits={resetUploadEdits}
                    submitted={hasSubmitted}
                    updateUploadEdits={updateUploadEdits}
                    uploadEdits={activeForm?.uploadEdits}
                  />
                </DocumentInfoProvider>
              ) : null}
            </div>
          </div>

          <ActionsBar />
        </div>

        {/* Nested Modals */}
        <AddFilesView modalSlug={addMoreFilesModalSlug} onDrop={handleAddFiles} />
        <DiscardWithoutSaving />
      </DialogModal>
    </>
  )
}
