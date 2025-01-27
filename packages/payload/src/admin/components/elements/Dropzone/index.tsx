import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '../Button'
import './index.scss'

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const baseClass = 'dropzone'

type Props = {
  className?: string
  mimeTypes?: string[]
  onChange: (e: FileList) => void
  onPasteUrlClick?: () => void
}

export const Dropzone: React.FC<Props> = ({ className, mimeTypes, onChange, onPasteUrlClick }) => {
  const dropRef = React.useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef(null)

  const { t } = useTranslation(['upload', 'general'])

  const handlePaste = React.useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        onChange(e.clipboardData.files)
      }
    },
    [onChange],
  )

  const handleDragEnter = React.useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDrop = React.useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onChange(e.dataTransfer.files)
        setDragging(false)

        e.dataTransfer.clearData()
      }
    },
    [onChange],
  )

  const handleFileSelection = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onChange(e.target.files)
      }
    },
    [onChange],
  )

  React.useEffect(() => {
    const div = dropRef.current

    if (div) {
      div.addEventListener('dragenter', handleDragEnter)
      div.addEventListener('dragleave', handleDragLeave)
      div.addEventListener('dragover', handleDragOver)
      div.addEventListener('drop', handleDrop)
      div.addEventListener('paste', handlePaste)

      return () => {
        div.removeEventListener('dragenter', handleDragEnter)
        div.removeEventListener('dragleave', handleDragLeave)
        div.removeEventListener('dragover', handleDragOver)
        div.removeEventListener('drop', handleDrop)
        div.removeEventListener('paste', handlePaste)
      }
    }

    return () => null
  }, [handleDragEnter, handleDragLeave, handleDrop, handlePaste])

  const classes = [baseClass, className, dragging ? 'dragging' : ''].filter(Boolean).join(' ')

  return (
    <div className={classes} ref={dropRef}>
      <Button
        buttonStyle="secondary"
        className={`${baseClass}__file-button`}
        onClick={() => {
          inputRef.current.click()
        }}
        size="small"
      >
        {t('upload:selectFile')}
      </Button>
      <Button
        buttonStyle="secondary"
        className={`${baseClass}__file-button`}
        onClick={onPasteUrlClick}
        size="small"
      >
        {t('upload:pasteURL')}
      </Button>
      <input
        accept={mimeTypes?.join(',')}
        className={`${baseClass}__hidden-input`}
        onChange={handleFileSelection}
        ref={inputRef}
        type="file"
      />

      <p className={`${baseClass}__label`}>
        {t('general:or')} {t('dragAndDrop')}
      </p>
    </div>
  )
}
