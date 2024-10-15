'use client'
import type { FormState, SanitizedCollectionConfig, UploadEdits } from 'payload'

import { isImage, reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FieldError } from '../../fields/FieldError/index.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useUploadEdits } from '../../providers/UploadEdits/index.js'
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
  readonly customActions?: React.ReactNode[]
  readonly enableAdjustments: boolean
  readonly enablePreviewSizes: boolean
  readonly mimeType: string
}

export const UploadActions = ({
  customActions,
  enableAdjustments,
  enablePreviewSizes,
  mimeType,
}: UploadActionsArgs) => {
  const { t } = useTranslation()

  const fileTypeIsAdjustable = isImage(mimeType) && mimeType !== 'image/svg+xml'

  if (!fileTypeIsAdjustable && (!customActions || customActions.length === 0)) {
    return null
  }

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
  readonly collectionSlug: string
  readonly customActions?: React.ReactNode[]
  readonly initialState?: FormState
  readonly onChange?: (file?: File) => void
  readonly uploadConfig: SanitizedCollectionConfig['upload']
}

export const Upload: React.FC<UploadProps> = (props) => {
  const { collectionSlug, customActions, initialState, onChange, uploadConfig } = props

  const { t } = useTranslation()
  const { setModified } = useForm()
  const { resetUploadEdits, updateUploadEdits, uploadEdits } = useUploadEdits()
  const { docPermissions } = useDocumentInfo()
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: 'file',
    validate,
  })

  const [doc, setDoc] = useState(reduceFieldsToValues(initialState || {}, true))
  const [fileSrc, setFileSrc] = useState<null | string>(null)
  const [replacingFile, setReplacingFile] = useState(false)
  const [filename, setFilename] = useState<string>(value?.name || '')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [fileUrl, setFileUrl] = useState<string>('')

  const urlInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (newFile: File) => {
      if (newFile instanceof File) {
        setFileSrc(URL.createObjectURL(newFile))
      }

      setValue(newFile)
      setShowUrlInput(false)

      if (typeof onChange === 'function') {
        onChange(newFile)
      }
    },
    [onChange, setValue],
  )

  const renameFile = (fileToChange: File, newName: string): File => {
    // Creating a new File object with updated properties
    const newFile = new File([fileToChange], newName, {
      type: fileToChange.type,
      lastModified: fileToChange.lastModified,
    })
    return newFile
  }

  const handleFileNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const updatedFileName = e.target.value

      if (value) {
        handleFileChange(renameFile(value, updatedFileName))
        setFilename(updatedFileName)
      }
    },
    [handleFileChange, value],
  )

  const handleFileSelection = useCallback(
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

  const onEditsSave = useCallback(
    (args: UploadEdits) => {
      setModified(true)
      updateUploadEdits(args)
    },
    [setModified, updateUploadEdits],
  )

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
    setDoc(reduceFieldsToValues(initialState || {}, true))
    if (initialState?.file?.value instanceof File) {
      setFileSrc(URL.createObjectURL(initialState.file.value))
    }
    setReplacingFile(false)
  }, [initialState])

  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      // urlInputRef.current.focus() // Focus on the remote-url input field when showUrlInput is true
    }
  }, [showUrlInput])

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

  const acceptMimeTypes = uploadConfig.mimeTypes?.join(', ')

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <FieldError field={null} message={errorMessage} showError={showError} />
      {doc.filename && !replacingFile && (
        <FileDetails
          collectionSlug={collectionSlug}
          customUploadActions={customActions}
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
          {!value && !showUrlInput && (
            <Dropzone onChange={handleFileSelection}>
              <div className={`${baseClass}__dropzoneContent`}>
                <div className={`${baseClass}__dropzoneButtons`}>
                  <Button
                    buttonStyle="pill"
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.click()
                      }
                    }}
                    size="small"
                  >
                    {t('upload:selectFile')}
                  </Button>
                  <input
                    accept={acceptMimeTypes}
                    aria-hidden="true"
                    className={`${baseClass}__hidden-input`}
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelection(e.target.files)
                      }
                    }}
                    ref={inputRef}
                    type="file"
                  />
                  <span className={`${baseClass}__orText`}>{t('general:or')}</span>
                  <Button
                    buttonStyle="pill"
                    onClick={() => {
                      setShowUrlInput(true)
                    }}
                    size="small"
                  >
                    {t('upload:pasteURL')}
                  </Button>
                </div>

                <p className={`${baseClass}__dragAndDropText`}>
                  {t('general:or')} {t('upload:dragAndDrop')}
                </p>
              </div>
            </Dropzone>
          )}
          {showUrlInput && (
            <React.Fragment>
              <div className={`${baseClass}__remote-file-wrap`}>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <input
                  className={`${baseClass}__remote-file`}
                  onChange={(e) => {
                    setFileUrl(e.target.value)
                  }}
                  ref={urlInputRef}
                  type="text"
                  value={fileUrl}
                />
                <div className={`${baseClass}__add-file-wrap`}>
                  <button
                    className={`${baseClass}__add-file`}
                    onClick={() => {
                      void handleUrlSubmit()
                    }}
                    type="button"
                  >
                    {t('upload:addFile')}
                  </button>
                </div>
              </div>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="with-border"
                onClick={() => {
                  setShowUrlInput(false)
                }}
                round
                tooltip={t('general:cancel')}
              />
            </React.Fragment>
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
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <input
                  className={`${baseClass}__filename`}
                  onChange={handleFileNameChange}
                  type="text"
                  value={filename || value.name}
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
            fileSrc={doc?.url || fileSrc}
            imageCacheTag={doc.updatedAt}
            initialCrop={uploadEdits?.crop ?? undefined}
            initialFocalPoint={{
              x: uploadEdits?.focalPoint?.x || doc.focalX || 50,
              y: uploadEdits?.focalPoint?.y || doc.focalY || 50,
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
