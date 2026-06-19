'use client'

import type { UploadEdits } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useRef, useState } from 'react'
import ReactCrop from 'react-image-crop'

import { editDrawerSlug } from '../../elements/Upload/index.js'
import { NumberInput } from '../../fields/Number/Input.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { appendCacheTag } from '../../utilities/appendCacheTag.js'
import { Button } from '../Button/index.js'
import { DialogBody, DialogFooter, DialogHeader, DialogModal } from '../Dialog/index.js'
import './index.css'
import './library.css'

const baseClass = 'edit-upload'

type FocalPosition = {
  x: number
  y: number
}

export type EditUploadProps = {
  fileName: string
  fileSrc: string
  imageCacheTag?: false | string
  initialCrop?: UploadEdits['crop']
  initialFocalPoint?: FocalPosition
  onSave?: (uploadEdits: UploadEdits) => void
  showCrop?: boolean
  showFocalPoint?: boolean
}

const defaultCrop: UploadEdits['crop'] = {
  height: 100,
  unit: '%',
  width: 100,
  x: 0,
  y: 0,
}

export const EditUpload: React.FC<EditUploadProps> = ({
  fileName,
  fileSrc,
  imageCacheTag,
  initialCrop,
  initialFocalPoint,
  onSave,
  showCrop,
  showFocalPoint,
}) => {
  const { closeModal } = useModal()
  const { t } = useTranslation()

  const [crop, setCrop] = useState<UploadEdits['crop']>(() => ({
    ...defaultCrop,
    ...(initialCrop || {}),
  }))

  const defaultFocalPosition: FocalPosition = { x: 50, y: 50 }

  const [focalPosition, setFocalPosition] = useState<FocalPosition>(() => ({
    ...defaultFocalPosition,
    ...initialFocalPoint,
  }))

  const [checkBounds, setCheckBounds] = useState<boolean>(false)
  const [uncroppedPixelHeight, setUncroppedPixelHeight] = useState<number>(0)
  const [uncroppedPixelWidth, setUncroppedPixelWidth] = useState<number>(0)

  const focalWrapRef = useRef<HTMLDivElement | undefined>(undefined)
  const imageRef = useRef<HTMLImageElement | undefined>(undefined)
  const cropRef = useRef<HTMLDivElement | undefined>(undefined)

  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  const onImageLoad = (e) => {
    setUncroppedPixelHeight(e.currentTarget.naturalHeight)
    setUncroppedPixelWidth(e.currentTarget.naturalWidth)
    setImageLoaded(true)
  }

  const fineTuneCrop = ({ dimension, value }: { dimension: 'height' | 'width'; value: string }) => {
    const intValue = parseInt(value)
    const percentage =
      100 * (intValue / (dimension === 'width' ? uncroppedPixelWidth : uncroppedPixelHeight))
    if (percentage <= 0 || percentage > 100) {
      return null
    }
    setCrop((prev) => ({ ...prev, [dimension]: percentage }))
  }

  const fineTuneFocalPosition = ({
    coordinate,
    value,
  }: {
    coordinate: 'x' | 'y'
    value: string
  }) => {
    const intValue = parseInt(value)
    if (intValue >= 0 && intValue <= 100) {
      setFocalPosition((prevPosition) => ({ ...prevPosition, [coordinate]: intValue }))
    }
  }

  const saveEdits = () => {
    if (typeof onSave === 'function') {
      onSave({
        crop: crop ? crop : undefined,
        focalPoint: focalPosition,
        heightInPixels: Math.round((crop.height / 100) * uncroppedPixelHeight),
        widthInPixels: Math.round((crop.width / 100) * uncroppedPixelWidth),
      })
    }
    closeModal(editDrawerSlug)
  }

  const onDragEnd = React.useCallback(({ x, y }) => {
    setFocalPosition({ x, y })
    setCheckBounds(false)
  }, [])

  const centerFocalPoint = () => {
    setFocalPosition({ x: 50, y: 50 })
  }

  const fileSrcToUse = fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : undefined

  const cropWidthPx = ((crop.width / 100) * uncroppedPixelWidth).toFixed(0)
  const cropHeightPx = ((crop.height / 100) * uncroppedPixelHeight).toFixed(0)

  return (
    <DialogModal
      className={`${baseClass}__dialog`}
      closeOnBlur={false}
      size="large"
      slug={editDrawerSlug}
    >
      <DialogHeader showClose title={`${t('general:editing')} ${fileName}`} />
      <DialogBody>
        <div className={`${baseClass}__content`}>
          {/* Canvas area */}
          <div className={`${baseClass}__crop`}>
            <div
              className={`${baseClass}__focal-wrapper`}
              ref={focalWrapRef}
              style={{ aspectRatio: `${uncroppedPixelWidth / uncroppedPixelHeight}` }}
            >
              {showCrop ? (
                <ReactCrop
                  className={`${baseClass}__reactCrop`}
                  crop={crop}
                  onChange={(_, c) => setCrop(c)}
                  onComplete={() => setCheckBounds(true)}
                  renderSelectionAddon={() => (
                    <div className={`${baseClass}__crop-window`} ref={cropRef} />
                  )}
                >
                  <img
                    alt={t('upload:setCropArea')}
                    onLoad={onImageLoad}
                    ref={imageRef}
                    src={fileSrcToUse}
                  />
                </ReactCrop>
              ) : (
                <img
                  alt={t('upload:setFocalPoint')}
                  onLoad={onImageLoad}
                  ref={imageRef}
                  src={fileSrcToUse}
                />
              )}
              {showFocalPoint && (
                <DraggableElement
                  boundsRef={showCrop ? cropRef : imageRef}
                  checkBounds={showCrop ? checkBounds : false}
                  className={`${baseClass}__focalPoint`}
                  containerRef={focalWrapRef}
                  initialPosition={focalPosition}
                  onDragEnd={onDragEnd}
                  setCheckBounds={showCrop ? setCheckBounds : false}
                >
                  <PlusIcon />
                </DraggableElement>
              )}
            </div>
          </div>

          {/* Sidebar */}
          {(showCrop || showFocalPoint) && (
            <div className={`${baseClass}__sidebar`}>
              {showCrop && (
                <div className={`${baseClass}__section`}>
                  <div className={`${baseClass}__section-header`}>
                    <span className={`${baseClass}__section-title`}>{t('upload:crop')}</span>
                    <Button
                      buttonStyle="ghost"
                      className={`${baseClass}__reset`}
                      onClick={() => setCrop({ height: 100, unit: '%', width: 100, x: 0, y: 0 })}
                    >
                      {t('general:reset')}
                    </Button>
                  </div>
                  <div className={`${baseClass}__fieldset`}>
                    <NumberInput
                      className={`${baseClass}__field`}
                      label="W"
                      onChange={(e) =>
                        fineTuneCrop({
                          dimension: 'width',
                          value: (e as React.ChangeEvent<HTMLInputElement>).target.value,
                        })
                      }
                      path="cropWidth"
                      readOnly={!imageLoaded}
                      value={Number(cropWidthPx)}
                    />
                    <NumberInput
                      className={`${baseClass}__field`}
                      label="H"
                      onChange={(e) =>
                        fineTuneCrop({
                          dimension: 'height',
                          value: (e as React.ChangeEvent<HTMLInputElement>).target.value,
                        })
                      }
                      path="cropHeight"
                      readOnly={!imageLoaded}
                      value={Number(cropHeightPx)}
                    />
                  </div>
                </div>
              )}

              {showFocalPoint && (
                <div className={`${baseClass}__section`}>
                  <div className={`${baseClass}__section-header`}>
                    <span className={`${baseClass}__section-title`}>{t('upload:focalPoint')}</span>
                    <Button
                      buttonStyle="ghost"
                      className={`${baseClass}__reset`}
                      onClick={centerFocalPoint}
                    >
                      {t('general:reset')}
                    </Button>
                  </div>
                  <div className={`${baseClass}__fieldset`}>
                    <NumberInput
                      AfterInput={<span className={`${baseClass}__suffix`}>%</span>}
                      className={`${baseClass}__field`}
                      label="X"
                      max={100}
                      min={0}
                      onChange={(e) =>
                        fineTuneFocalPosition({
                          coordinate: 'x',
                          value: (e as React.ChangeEvent<HTMLInputElement>).target.value,
                        })
                      }
                      path="focalX"
                      value={Math.round(focalPosition.x)}
                    />
                    <NumberInput
                      AfterInput={<span className={`${baseClass}__suffix`}>%</span>}
                      className={`${baseClass}__field`}
                      label="Y"
                      max={100}
                      min={0}
                      onChange={(e) =>
                        fineTuneFocalPosition({
                          coordinate: 'y',
                          value: (e as React.ChangeEvent<HTMLInputElement>).target.value,
                        })
                      }
                      path="focalY"
                      value={Math.round(focalPosition.y)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          aria-label={t('general:cancel')}
          buttonStyle="secondary"
          onClick={() => closeModal(editDrawerSlug)}
        >
          {t('general:cancel')}
        </Button>
        <Button
          aria-label={t('general:applyChanges')}
          buttonStyle="primary"
          disabled={!imageLoaded}
          onClick={saveEdits}
        >
          {t('general:applyChanges')}
        </Button>
      </DialogFooter>
    </DialogModal>
  )
}

const DraggableElement = ({
  boundsRef,
  checkBounds,
  children,
  className,
  containerRef,
  initialPosition = { x: 50, y: 50 },
  onDragEnd,
  setCheckBounds,
}) => {
  const [position, setPosition] = useState({ x: initialPosition.x, y: initialPosition.y })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLButtonElement | undefined>(undefined)
  // Keep a ref to the latest position so global mouseup handler can read it without a stale closure
  const positionRef = useRef(position)
  positionRef.current = position

  const getCoordinates = React.useCallback(
    (mouseX: number, mouseY: number) => {
      const containerRect = containerRef.current.getBoundingClientRect()
      const x = ((mouseX - containerRect.left) / containerRect.width) * 100
      const y = ((mouseY - containerRect.top) / containerRect.height) * 100
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
    },
    [containerRef],
  )

  const handleMouseDown = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  // Attach global listeners while dragging — this ensures events fire even when
  // the cursor leaves the focal wrapper area during a fast drag
  React.useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) {
        return
      }
      const { x, y } = getCoordinates(e.clientX, e.clientY)
      setPosition({ x, y })
    }

    const handleUp = () => {
      setIsDragging(false)
      onDragEnd(positionRef.current)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, getCoordinates, onDragEnd, containerRef])

  // Re-check position when crop changes (the crop window may have moved)
  React.useEffect(() => {
    if (isDragging || !checkBounds || !dragRef.current) {
      return
    }
    const { height, left, top, width } = dragRef.current.getBoundingClientRect()
    const { x, y } = getCoordinates(left + width / 2, top + height / 2)
    onDragEnd({ x, y })
    setPosition({ x, y })
    setCheckBounds(false)
  }, [getCoordinates, isDragging, checkBounds, setCheckBounds, onDragEnd])

  React.useEffect(() => {
    setPosition({ x: initialPosition.x, y: initialPosition.y })
  }, [initialPosition.x, initialPosition.y])

  return (
    <div className={`${baseClass}__draggable-container`}>
      <button
        className={[`${baseClass}__draggable`, className].filter(Boolean).join(' ')}
        onMouseDown={handleMouseDown}
        ref={dragRef}
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
        type="button"
      >
        {children}
      </button>
    </div>
  )
}
