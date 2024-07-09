import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

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
import { useForm } from '../../../../forms/Form/context'
import reduceFieldsToValues from '../../../../forms/Form/reduceFieldsToValues'
import { fieldBaseClass } from '../../../../forms/field-types/shared'
import useField from '../../../../forms/useField'
import { useDocumentInfo } from '../../../../utilities/DocumentInfo'
import { useUploadEdits } from '../../../../utilities/UploadEdits'
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
  const { collection, internalState, onChange } = props
  const [replacingFile, setReplacingFile] = useState(false)
  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const { t } = useTranslation(['upload', 'general'])
  const { resetUploadEdits } = useUploadEdits()
  const [doc, setDoc] = useState(reduceFieldsToValues(internalState || {}, true))
  const { docPermissions } = useDocumentInfo()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })

  const [showUrlInput, setShowUrlInput] = useState(false)
  const [fileUrl, setFileUrl] = useState<string>('')

  const handleFileChange = useCallback(
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
      setShowUrlInput(false)

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
    setFileUrl('')
    setDoc({})
    resetUploadEdits()
    setShowUrlInput(false)
  }, [handleFileChange, resetUploadEdits])

  const handlePasteUrlClick = () => {
    setShowUrlInput((prev) => !prev)
  }

  const handleUrlSubmit = async () => {
    if (fileUrl) {
      try {
        const response = await fetch(fileUrl)
        const data = await response.blob()

        // Extract the file name from the URL
        const fileName = fileUrl.split('/').pop()

        // Create a new File object from the Blob data
        const file = new File([data], fileName, { type: data.type })
        handleFileChange(file)
      } catch (e) {
        toast.error(e.message)
      }
    }
  }

  useEffect(() => {
    setDoc(reduceFieldsToValues(internalState || {}, true))
    setReplacingFile(false)
  }, [internalState])

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
          imageCacheTag={doc.updatedAt}
        />
      )}
      {(!doc.filename || replacingFile) && (
        <div className={`${baseClass}__upload`}>
          {!value && !showUrlInput && (
            <Dropzone
              allowRemoteUpload={collection?.upload?.allowRemoteUpload}
              className={`${baseClass}__dropzone`}
              mimeTypes={collection?.upload?.mimeTypes}
              onChange={handleFileSelection}
              onPasteUrlClick={handlePasteUrlClick}
            />
          )}
          {showUrlInput && (
            <React.Fragment>
              <div className={`${baseClass}__remote-file-wrap`}>
                <input
                  className={`${baseClass}__remote-file`}
                  onChange={(e) => {
                    setFileUrl(e.target.value)
                  }}
                  type="text"
                  value={fileUrl}
                />
                <div className={`${baseClass}__add-file-wrap`}>
                  <button
                    className={`${baseClass}__add-file`}
                    onClick={handleUrlSubmit}
                    type="button"
                  >
                    {t('upload:addImage')}
                  </button>
                </div>
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
            fileSrc={doc?.url || fileSrc}
            imageCacheTag={doc.updatedAt}
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
          <PreviewSizes collection={collection} doc={doc} imageCacheTag={doc.updatedAt} />
        </Drawer>
      )}
    </div>
  )
}
