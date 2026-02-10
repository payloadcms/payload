'use client'
import React from 'react'

import './index.scss'

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const baseClass = 'dropzone'

export type Props = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly disabled?: boolean
  readonly dropzoneStyle?: 'default' | 'none'
  readonly multipleFiles?: boolean
  readonly onChange: (e: File[] | FileList) => void
}

export function Dropzone({
  children,
  className,
  disabled = false,
  dropzoneStyle = 'default',
  multipleFiles,
  onChange,
}: Props) {
  const dropRef = React.useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const addFiles = React.useCallback(
    (files: FileList) => {
      if (!multipleFiles && files.length > 1) {
        onChange([files[0]])
      } else {
        onChange(files)
      }
    },
    [multipleFiles, onChange],
  )

  const handlePaste = React.useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        addFiles(e.clipboardData.files)
      }
    },
    [addFiles],
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
        addFiles(e.dataTransfer.files)
        setDragging(false)

        try {
          e.dataTransfer.clearData()
        } catch {
          // Firefox throws NoModificationAllowedError when calling clearData() on a protected DataTransfer during drop events
          // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/clearData#exceptions
        }
      }
    },
    [addFiles],
  )

  React.useEffect(() => {
    const div = dropRef.current

    if (div && !disabled) {
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
  }, [disabled, handleDragEnter, handleDragLeave, handleDrop, handlePaste])

  const classes = [
    baseClass,
    className,
    dragging ? 'dragging' : '',
    `dropzoneStyle--${dropzoneStyle}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} ref={dropRef}>
      {children}
    </div>
  )
}
