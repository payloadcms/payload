import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import isImage from '../../../../../../uploads/isImage'
import Button from '../../../../elements/Button'
import { Drawer, DrawerToggler } from '../../../../elements/Drawer'
import { Dropzone } from '../../../../elements/Dropzone'
import { EditUpload } from '../../../../elements/EditUpload'
import FileDetails from '../../../../elements/FileDetails'
import PreviewSizes from '../../../../elements/PreviewSizes'
import Thumbnail from '../../../../elements/Thumbnail'
import Error from '../../../../forms/Error'
import { useFormSubmitted } from '../../../../forms/Form/context'
import reduceFieldsToValues from '../../../../forms/Form/reduceFieldsToValues'
import { fieldBaseClass } from '../../../../forms/field-types/shared'
import useField from '../../../../forms/useField'
import { useDocumentInfo } from '../../../../utilities/DocumentInfo'
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
  const { t } = useTranslation('upload')
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
  const submitted = useFormSubmitted()
  const { collection, internalState, onChange, updatedAt } = props
  const [replacingFile, setReplacingFile] = useState(false)
  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const { t } = useTranslation(['upload', 'general'])
  const [doc, setDoc] = useState(reduceFieldsToValues(internalState || {}, true))
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
    setDoc(reduceFieldsToValues(internalState || {}, true))
    setReplacingFile(false)
  }, [internalState])

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

  const hasImageSizes = collection?.upload?.imageSizes?.length > 0
  const hasResizeOptions = Boolean(collection?.upload?.resizeOptions)
  // Explicitly check if set to true, default is undefined
  const focalPointEnabled = collection?.upload?.focalPoint === true

  const { collection: { upload: { crop: showCrop = true, focalPoint = true } } = {} } = props

  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions || focalPointEnabled)

  const lastSubmittedTime = submitted ? new Date().toISOString() : null

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <Error message={errorMessage} showError={showError} />

      {doc.filename && !replacingFile && (
        <FileDetails
          canEdit={showCrop || showFocalPoint}
          collection={collection}
          doc={doc}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
          hasImageSizes={hasImageSizes}
          imageCacheTag={lastSubmittedTime}
        />
      )}

      {(!doc.filename || replacingFile) && (
        <div className={`${baseClass}__upload`}>
          {!value && (
            <Dropzone
              className={`${baseClass}__dropzone`}
              mimeTypes={collection?.upload?.mimeTypes}
              onChange={handleFileSelection}
            />
          )}

          {value && (
            <React.Fragment>
              <div className={`${baseClass}__thumbnail-wrap`}>
                <Thumbnail fileSrc={isImage(value.type) ? fileSrc : null} />
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
        <Drawer header={null} slug={editDrawerSlug}>
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
          <PreviewSizes collection={collection} doc={doc} />
        </Drawer>
      )}
    </div>
  )
}
