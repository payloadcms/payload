'use client'
import type { FormState, SanitizedCollectionConfig } from 'payload'

import { isImage } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import { FieldError } from '../../fields/FieldError/index.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { useForm } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useFormQueryParams } from '../../providers/FormQueryParams/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToValues } from '../../utilities/reduceFieldsToValues.js'
import { Button } from '../Button/index.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { Dropzone } from '../Dropzone/index.js'
import { EditUpload } from '../EditUpload/index.js'
import { FileDetails } from '../FileDetails/index.js'
import { PreviewSizes } from '../PreviewSizes/index.js'
import { Thumbnail } from '../Thumbnail/index.js'
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

export type UploadProps = {
  collectionSlug: string
  initialState?: FormState
  onChange?: (file?: File) => void
  updatedAt?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const Upload: React.FC<UploadProps> = (props) => {
  const { collectionSlug, initialState, onChange, updatedAt, uploadConfig } = props

  const [replacingFile, setReplacingFile] = useState(false)
  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const { t } = useTranslation()
  const { setModified } = useForm()
  const { dispatchFormQueryParams, formQueryParams } = useFormQueryParams()
  const [doc, setDoc] = useState(reduceFieldsToValues(initialState || {}, true))
  const { docPermissions } = useDocumentInfo()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })
  const [_crop, setCrop] = useState({ x: 0, y: 0 })

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

  const onEditsSave = React.useCallback(
    ({ crop, focalPosition }) => {
      setCrop({
        x: crop.x || 0,
        y: crop.y || 0,
      })

      setModified(true)
      dispatchFormQueryParams({
        type: 'SET',
        params: {
          uploadEdits:
            crop || focalPosition
              ? {
                  crop: crop || null,
                  focalPoint: focalPosition ? focalPosition : null,
                }
              : null,
        },
      })
    },
    [dispatchFormQueryParams, setModified],
  )

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
  // Explicity check if set to true, default is undefined
  const focalPointEnabled = uploadConfig?.focalPoint === true

  const { crop: showCrop = true, focalPoint = true } = uploadConfig

  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions || focalPointEnabled)

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <FieldError message={errorMessage} showError={showError} />
      {doc.filename && !replacingFile && (
        <FileDetails
          canEdit={showCrop || showFocalPoint}
          collectionSlug={collectionSlug}
          doc={doc}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
          hasImageSizes={hasImageSizes}
          imageCacheTag={doc.updatedAt}
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
            fileName={value?.name || doc?.filename}
            fileSrc={fileSrc || doc?.url}
            imageCacheTag={doc.updatedAt}
            initialCrop={formQueryParams?.uploadEdits?.crop ?? {}}
            initialFocalPoint={{
              x: formQueryParams?.uploadEdits?.focalPoint.x || doc.focalX || 50,
              y: formQueryParams?.uploadEdits?.focalPoint.y || doc.focalY || 50,
            }}
            onSave={onEditsSave}
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
          <PreviewSizes doc={doc} imageCacheTag={doc.updatedAt} uploadConfig={uploadConfig} />
        </Drawer>
      )}
    </div>
  )
}
