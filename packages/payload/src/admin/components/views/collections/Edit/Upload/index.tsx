import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import Button from '../../../../elements/Button'
import { Drawer, DrawerToggler } from '../../../../elements/Drawer'
import { Dropzone } from '../../../../elements/Dropzone'
import EditUpload from '../../../../elements/EditUpload'
import FileDetails from '../../../../elements/FileDetails'
import Error from '../../../../forms/Error'
import reduceFieldsToValues from '../../../../forms/Form/reduceFieldsToValues'
import useField from '../../../../forms/useField'
import FileGraphic from '../../../../graphics/File'
import { useDocumentInfo } from '../../../../utilities/DocumentInfo'
import './index.scss'

const baseClass = 'file-field'
const drawerSlug = 'edit-upload'

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.'
  }

  return true
}

export const Upload: React.FC<Props> = (props) => {
  const { collection, internalState, onChange, setUploadEdits, uploadEdits } = props
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
  }, [value, onChange])

  const classes = [baseClass, 'field-type'].filter(Boolean).join(' ')

  const canRemoveUpload =
    docPermissions?.update?.permission &&
    'delete' in docPermissions &&
    docPermissions?.delete?.permission

  return (
    <div className={classes}>
      <Error message={errorMessage} showError={showError} />

      {doc.filename && !replacingFile && (
        <FileDetails
          collection={collection}
          doc={doc}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
        />
      )}

      {(!doc.filename || replacingFile) && (
        <div className={`${baseClass}__upload`}>
          {value && (
            <React.Fragment>
              <div className={`${baseClass}__file-preview`}>
                {fileSrc ? <img alt={value.name} src={fileSrc} /> : <FileGraphic />}
              </div>

              <div className={`${baseClass}__file-adjustments`}>
                <div className={`${baseClass}__filename`}>
                  <input onChange={handleFileNameChange} type="text" value={value.name} />
                  <Button
                    buttonStyle="icon-label"
                    icon="x"
                    iconStyle="with-border"
                    onClick={handleFileRemoval}
                    round
                    tooltip={t('general:cancel')}
                  />
                </div>

                <div className={`${baseClass}__file-mutation`}>
                  <DrawerToggler className={`${baseClass}__edit`} slug={drawerSlug}>
                    Preview Sizes
                  </DrawerToggler>
                  <DrawerToggler className={`${baseClass}__edit`} slug={drawerSlug}>
                    Edit Image
                  </DrawerToggler>
                </div>
              </div>
            </React.Fragment>
          )}

          <Drawer slug={drawerSlug} title={`Editing ${value?.name}`}>
            <EditUpload
              fileSrc={fileSrc}
              setUploadEdits={setUploadEdits}
              uploadEdits={uploadEdits}
            />
          </Drawer>

          {!value && (
            <Dropzone
              className={`${baseClass}__dropzone`}
              mimeTypes={collection?.upload?.mimeTypes}
              onChange={handleFileSelection}
            />
          )}
        </div>
      )}
    </div>
  )
}
