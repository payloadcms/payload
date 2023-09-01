import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import Button from '../../../../elements/Button'
import FileDetails from '../../../../elements/FileDetails'
import Error from '../../../../forms/Error'
import reduceFieldsToValues from '../../../../forms/Form/reduceFieldsToValues'
import Label from '../../../../forms/Label'
import useField from '../../../../forms/useField'
import { useDocumentInfo } from '../../../../utilities/DocumentInfo'
import './index.scss'

const baseClass = 'file-field'

const handleDrag = (e) => {
  e.preventDefault()
  e.stopPropagation()
}

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.'
  }

  return true
}

const Upload: React.FC<Props> = (props) => {
  const { collection, internalState } = props

  const inputRef = useRef(null)
  const dropRef = useRef(null)
  const [selectingFile, setSelectingFile] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [replacingFile, setReplacingFile] = useState(false)
  const { t } = useTranslation(['upload', 'general'])
  const [doc, setDoc] = useState(reduceFieldsToValues(internalState || {}, true))
  const { docPermissions } = useDocumentInfo()

  const { errorMessage, setValue, showError, value } = useField<{ name: string }>({
    path: 'file',
    validate,
  })

  const handleDragIn = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((count) => count + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true)
    }
  }, [])

  const handleDragOut = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragCounter((count) => count - 1)
      if (dragCounter > 1) return
      setDragging(false)
    },
    [dragCounter],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setValue(e.dataTransfer.files[0])
        setDragging(false)

        e.dataTransfer.clearData()
        setDragCounter(0)
      } else {
        setDragging(false)
      }
    },
    [setValue],
  )

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedFileName = e.target.value
    if (value) {
      const fileValue = value as File
      // Creating a new File object with updated properties
      const newFile = new File([fileValue], updatedFileName, { type: fileValue.type })
      setValue(newFile) // Updating the state with the new File object
    }
  }

  // Only called when input is interacted with directly
  // Not called when drag + drop is used
  // Or when input is cleared
  const handleInputChange = useCallback(() => {
    setSelectingFile(false)
    setValue(inputRef?.current?.files?.[0] || null)
  }, [inputRef, setValue])

  useEffect(() => {
    if (selectingFile) {
      inputRef.current.click()
      setSelectingFile(false)
    }
  }, [selectingFile, inputRef, setSelectingFile])

  useEffect(() => {
    setDoc(reduceFieldsToValues(internalState || {}, true))
    setReplacingFile(false)
  }, [internalState])

  useEffect(() => {
    const div = dropRef.current
    if (div) {
      div.addEventListener('dragenter', handleDragIn)
      div.addEventListener('dragleave', handleDragOut)
      div.addEventListener('dragover', handleDrag)
      div.addEventListener('drop', handleDrop)

      return () => {
        div.removeEventListener('dragenter', handleDragIn)
        div.removeEventListener('dragleave', handleDragOut)
        div.removeEventListener('dragover', handleDrag)
        div.removeEventListener('drop', handleDrop)
      }
    }

    return () => null
  }, [handleDragIn, handleDragOut, handleDrop, value])

  const classes = [baseClass, dragging && `${baseClass}--dragging`, 'field-type']
    .filter(Boolean)
    .join(' ')

  const canRemoveUpload =
    docPermissions?.update?.permission &&
    'delete' in docPermissions &&
    docPermissions?.delete?.permission

  return (
    <div className={classes}>
      <Error message={errorMessage} showError={showError} />
      {doc.filename && !replacingFile && (
        <FileDetails
          handleRemove={
            canRemoveUpload
              ? () => {
                  setReplacingFile(true)
                  setValue(null)
                }
              : undefined
          }
          collection={collection}
          doc={doc}
        />
      )}
      {(!doc.filename || replacingFile) && (
        <div className={`${baseClass}__upload`}>
          {value && (
            <div className={`${baseClass}__file-selected`}>
              <Label label={t('fileName')} required />
              <div className={`${baseClass}__file-upload`}>
                <input
                  className={`${baseClass}__filename`}
                  onChange={handleFileNameChange}
                  type="text"
                  value={value.name}
                />
                <Button
                  onClick={() => {
                    setValue(null)
                    inputRef.current.value = null
                  }}
                  buttonStyle="none"
                  icon="x"
                  tooltip={t('general:cancel')}
                />
              </div>
            </div>
          )}
          {!value && (
            <React.Fragment>
              <div
                onPaste={(e) => {
                  if (e?.clipboardData?.files.length) {
                    const fileObject = e.clipboardData.files[0]
                    if (fileObject) setValue(fileObject)
                  }
                }}
                className={`${baseClass}__drop-zone`}
                ref={dropRef}
              >
                <Button
                  buttonStyle="secondary"
                  className={`${baseClass}__file-button`}
                  onClick={() => setSelectingFile(true)}
                  size="small"
                >
                  {t('selectFile')}
                </Button>
                <p className={`${baseClass}__drag-label`}>
                  {t('general:or')} {t('dragAndDrop')}
                </p>
              </div>
            </React.Fragment>
          )}
          <input
            accept={collection?.upload?.mimeTypes?.join(',')}
            onChange={handleInputChange}
            ref={inputRef}
            type="file"
          />
        </div>
      )}
    </div>
  )
}

export default Upload
