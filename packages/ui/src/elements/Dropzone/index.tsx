'use client'
import React from 'react'

import './index.css'

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const baseClass = 'dropzone'

const isFileDrag = (e: DragEvent) => Boolean(e.dataTransfer?.types.includes('Files'))

export type Props = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly disabled?: boolean
  /**
   * - `default`: a dashed box with a background
   * - `none`: no styles
   * - `outline`: no styles until files are dragged over it, then a dashed outline. Use it to make a
   *   large area, such as a list or a modal, a drop target. Dropzones nested inside it still get the drag.
   * @default 'default'
   */
  readonly dropzoneStyle?: 'default' | 'none' | 'outline'
  readonly hasError?: boolean
  readonly isFocusable?: boolean
  /**
   * When false, the dropzone does not take files pasted into it, so paste works as normal in inputs inside it.
   * @default true
   */
  readonly isPasteEnabled?: boolean
  readonly multipleFiles?: boolean
  readonly onChange: (e: FileList) => void
}

export function Dropzone({
  children,
  className,
  disabled = false,
  dropzoneStyle = 'default',
  hasError = false,
  isFocusable = true,
  isPasteEnabled = true,
  multipleFiles,
  onChange,
}: Props) {
  const dropRef = React.useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const addFiles = React.useCallback(
    (files: FileList) => {
      if (!multipleFiles && files.length > 1) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(files[0])
        onChange(dataTransfer.files)
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

  /**
   * The elements the current drag has entered. The browser fires `dragleave` on a child when the
   * drag moves to its parent or a sibling, so `dragging` turns off only when no entered element is left.
   */
  const enteredTargetsRef = React.useRef<EventTarget[]>([])

  const handleDragEnter = React.useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isFileDrag(e)) {
      enteredTargetsRef.current = [...enteredTargetsRef.current, e.target]
      setDragging(true)
    }
  }, [])

  const handleDragLeave = React.useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const div = dropRef.current
    enteredTargetsRef.current = enteredTargetsRef.current.filter(
      (target) => target !== e.target && target instanceof Node && div?.contains(target),
    )

    if (enteredTargetsRef.current.length === 0) {
      setDragging(false)
    }
  }, [])

  const handleDrop = React.useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      enteredTargetsRef.current = []
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
      if (isPasteEnabled) {
        div.addEventListener('paste', handlePaste)
      }

      return () => {
        div.removeEventListener('dragenter', handleDragEnter)
        div.removeEventListener('dragleave', handleDragLeave)
        div.removeEventListener('dragover', handleDragOver)
        div.removeEventListener('drop', handleDrop)
        div.removeEventListener('paste', handlePaste)
      }
    }

    return () => null
  }, [disabled, handleDragEnter, handleDragLeave, handleDrop, handlePaste, isPasteEnabled])

  const classes = [
    baseClass,
    className,
    dragging ? 'dragging' : '',
    hasError && `${baseClass}--has-error`,
    `${baseClass}--style-${dropzoneStyle}`,
  ]
    .filter(Boolean)
    .join(' ')

  /* eslint-disable jsx-a11y/no-noninteractive-tabindex -- interactive via drag/drop/paste event listeners */
  return (
    <div
      className={classes}
      ref={dropRef}
      tabIndex={isFocusable && dropzoneStyle !== 'none' ? 0 : undefined}
    >
      {children}
    </div>
  )
  /* eslint-enable jsx-a11y/no-noninteractive-tabindex */
}
