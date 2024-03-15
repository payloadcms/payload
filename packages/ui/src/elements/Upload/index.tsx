'use client'
import { isImage } from 'payload/utilities'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types.js'

import Error from '../../forms/Error/index.js'
import { useFormSubmitted } from '../../forms/Form/context.js'
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues.js'
import { fieldBaseClass } from '../../forms/fields/shared.js'
import { useField } from '../../forms/useField/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { Dropzone } from '../Dropzone/index.js'
import { EditUpload } from '../EditUpload/index.js'
import FileDetails from '../FileDetails/index.js'
import PreviewSizes from '../PreviewSizes/index.js'
import Thumbnail from '../Thumbnail/index.js'
import './index.scss'

const baseClass = 'file-field'
export const editDrawerSlug = 'edit-upload'
export const sizePreviewSlug = 'preview-sizes'

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.'
  }

  return true
}

export const UploadActions = ({ canEdit, showSizePreviews }) => {
  const { t } = useTranslation()
  return (
    <div className={`${baseClass}__file-mutation`}>
      {showSizePreviews && (
        <DrawerToggler className={`${baseClass}__previewSizes`} slug={sizePreviewSlug}>
          {t('upload:previewSizes')}
        </DrawerToggler>
      )}
      {canEdit && (
        <DrawerToggler className={`${baseClass}__edit`} slug={editDrawerSlug}>
          {t('upload:editImage')}
        </DrawerToggler>
      )}
    </div>
  )
}

export const Upload: React.FC<Props> = (props) => {
  const { collectionSlug, initialState, onChange, updatedAt, uploadConfig } = props

  const submitted = useFormSubmitted()
  const [replacingFile, setReplacingFile] = useState(false)
  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const { t } = useTranslation()
  const [doc, setDoc] = useState(reduceFieldsToValues(initialState || {}, true))
  const { docPermissions } = useDocumentInfo()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedFileName = e.target.value
    if (value) {
      const fileValue = value
      // Creating a new File object with updated properties
      const newFile = new File([fileValue], updatedFileName, { type: fileValue.type })
      setValue(newFile) // Updating the state with the new File object
    }
  }

  const handleFileSelection = React.useCallback(
    (files: FileList) => {
      const fileToUpload = files?.[0]
      setValue(fileToUpload)
    },
    [setValue],
  )

  const handleFileRemoval = useCallback(() => {
    setReplacingFile(true)
    setValue(null)
    setFileSrc('')
  }, [setValue])

  useEffect(() => {
    setDoc(reduceFieldsToValues(initialState || {}, true))
    setReplacingFile(false)
  }, [initialState])

  useEffect(() => {
    if (value instanceof File) {
      const fileReader = new FileReader()
      fileReader.onload = (e) => {
        const imgSrc = e.target?.result

        if (typeof imgSrc === 'string') {
          setFileSrc(imgSrc)
        }
      }
      fileReader.readAsDataURL(value)
    }

    if (typeof onChange === 'function') {
      onChange(value)
    }
  }, [value, onChange, updatedAt])

  const canRemoveUpload =
    docPermissions?.update?.permission &&
    'delete' in docPermissions &&
    docPermissions?.delete?.permission

  const hasImageSizes = uploadConfig?.imageSizes?.length > 0
  const hasResizeOptions = Boolean(uploadConfig?.resizeOptions)

  const { crop: showCrop = true, focalPoint = true } = uploadConfig

  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions)

  const lastSubmittedTime = submitted ? new Date().toISOString() : null

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <Error message={errorMessage} showError={showError} />
      {doc.filename && !replacingFile && (
        <FileDetails
          canEdit={showCrop || showFocalPoint}
          collectionSlug={collectionSlug}
          doc={doc}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
          hasImageSizes={hasImageSizes}
          imageCacheTag={lastSubmittedTime}
          uploadConfig={uploadConfig}
        />
      )}
      {(!doc.filename || replacingFile) && (
        <div className={`${baseClass}__upload`}>
          {!value && (
            <Dropzone
              className={`${baseClass}__dropzone`}
              mimeTypes={uploadConfig?.mimeTypes}
              onChange={handleFileSelection}
            />
          )}

          {value && (
            <React.Fragment>
              <div className={`${baseClass}__thumbnail-wrap`}>
                <Thumbnail
                  collectionSlug={collectionSlug}
                  fileSrc={isImage(value.type) ? fileSrc : null}
                />
              </div>
              <div className={`${baseClass}__file-adjustments`}>
                <input
                  className={`${baseClass}__filename`}
                  onChange={handleFileNameChange}
                  type="text"
                  value={value.name}
                />

                {isImage(value.type) && value.type !== 'image/svg+xml' && (
                  <UploadActions
                    canEdit={showCrop || showFocalPoint}
                    showSizePreviews={hasImageSizes && doc.filename && !replacingFile}
                  />
                )}
              </div>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="with-border"
                onClick={handleFileRemoval}
                round
                tooltip={t('general:cancel')}
              />
            </React.Fragment>
          )}
        </div>
      )}
      {(value || doc.filename) && (
        <Drawer Header={null} slug={editDrawerSlug}>
          <EditUpload
            doc={doc || undefined}
            fileName={value?.name || doc?.filename}
            fileSrc={fileSrc || doc?.url}
            imageCacheTag={lastSubmittedTime}
            showCrop={showCrop}
            showFocalPoint={showFocalPoint}
          />
        </Drawer>
      )}
      {doc && hasImageSizes && (
        <Drawer
          className={`${baseClass}__previewDrawer`}
          hoverTitle
          slug={sizePreviewSlug}
          title={t('upload:sizesFor', { label: doc?.filename })}
        >
          <PreviewSizes doc={doc} uploadConfig={uploadConfig} />
        </Drawer>
      )}
    </div>
  )
}
