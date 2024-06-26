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

type UploadActionsArgs = {
  customActions?: React.ReactNode[]
  enableAdjustments: boolean
  enablePreviewSizes: boolean
  mimeType: string
}

export const UploadActions = ({
  customActions,
  enableAdjustments,
  enablePreviewSizes,
  mimeType,
}: UploadActionsArgs) => {
  const { t } = useTranslation()

  const fileTypeIsAdjustable = isImage(mimeType) && mimeType !== 'image/svg+xml'

  if (!fileTypeIsAdjustable && (!customActions || customActions.length === 0)) return null

  return (
    <div className={`${baseClass}__upload-actions`}>
      {fileTypeIsAdjustable && (
        <React.Fragment>
          {enablePreviewSizes && (
            <DrawerToggler className={`${baseClass}__previewSizes`} slug={sizePreviewSlug}>
              {t('upload:previewSizes')}
            </DrawerToggler>
          )}
          {enableAdjustments && (
            <DrawerToggler className={`${baseClass}__edit`} slug={editDrawerSlug}>
              {t('upload:editImage')}
            </DrawerToggler>
          )}
        </React.Fragment>
      )}

      {customActions &&
        customActions.map((CustomAction, i) => {
          return <React.Fragment key={i}>{CustomAction}</React.Fragment>
        })}
    </div>
  )
}

export type UploadProps = {
  collectionSlug: string
  customActions?: React.ReactNode[]
  initialState?: FormState
  onChange?: (file?: File) => void
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const Upload: React.FC<UploadProps> = (props) => {
  const { collectionSlug, customActions, initialState, onChange, uploadConfig } = props

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

  const handleFileChange = React.useCallback(
    (newFile: File) => {
      if (newFile instanceof File) {
        const fileReader = new FileReader()
        fileReader.onload = (e) => {
          const imgSrc = e.target?.result

          if (typeof imgSrc === 'string') {
            setFileSrc(imgSrc)
          }
        }
        fileReader.readAsDataURL(newFile)
      }

      setValue(newFile)

      if (typeof onChange === 'function') {
        onChange(newFile)
      }
    },
    [onChange, setValue],
  )

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedFileName = e.target.value
    if (value) {
      const fileValue = value
      // Creating a new File object with updated properties
      const newFile = new File([fileValue], updatedFileName, { type: fileValue.type })
      handleFileChange(newFile)
    }
  }

  const handleFileSelection = React.useCallback(
    (files: FileList) => {
      const fileToUpload = files?.[0]
      handleFileChange(fileToUpload)
    },
    [handleFileChange],
  )

  const handleFileRemoval = useCallback(() => {
    setReplacingFile(true)
    handleFileChange(null)
    setFileSrc('')
  }, [handleFileChange])

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
          collectionSlug={collectionSlug}
          doc={doc}
          enableAdjustments={showCrop || showFocalPoint}
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

          {value && fileSrc && (
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
                <UploadActions
                  customActions={customActions}
                  enableAdjustments={showCrop || showFocalPoint}
                  enablePreviewSizes={hasImageSizes && doc.filename && !replacingFile}
                  mimeType={value.type}
                />
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
