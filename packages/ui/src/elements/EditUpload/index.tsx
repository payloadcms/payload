'use client'

import type { TransformState, UploadEdits } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useRef, useState } from 'react'
import ReactCrop from 'react-image-crop'

import { editDrawerSlug } from '../../elements/Upload/index.js'
import { NumberInput } from '../../fields/Number/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { ResetIcon } from '../../icons/Reset/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { appendCacheTag } from '../../utilities/appendCacheTag.js'
import { Button } from '../Button/index.js'
import { DialogFooter, DialogHeader, DialogModal } from '../Dialog/index.js'
import { toPercentCrop, toPixelCrop } from './cropState.js'
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
  initialTransforms?: null | TransformState
  onSave?: (transforms: null | TransformState) => void
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
  initialTransforms,
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
    ...(initialTransforms?.focalPoint ?? initialFocalPoint),
  }))

  const [hasCropChanged, setHasCropChanged] = useState(
    Boolean(initialCrop && !initialTransforms?.crop),
  )
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({})
  const [hasFocalPointChanged, setHasFocalPointChanged] = useState(false)
  const [uncroppedPixelHeight, setUncroppedPixelHeight] = useState<number>(0)
  const [uncroppedPixelWidth, setUncroppedPixelWidth] = useState<number>(0)

  const focalWrapRef = useRef<HTMLDivElement | undefined>(undefined)
  const imageRef = useRef<HTMLImageElement | undefined>(undefined)
  const cropRef = useRef<HTMLDivElement | undefined>(undefined)

  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const height = e.currentTarget.naturalHeight
    const width = e.currentTarget.naturalWidth

    setUncroppedPixelHeight(height)
    setUncroppedPixelWidth(width)
    setCrop(
      initialTransforms?.crop
        ? toPercentCrop({ crop: initialTransforms.crop, height, width })
        : (initialCrop ?? defaultCrop),
    )
    setFocalPosition(initialTransforms?.focalPoint ?? initialFocalPoint ?? { x: 50, y: 50 })
    setHasCropChanged(Boolean(initialCrop && !initialTransforms?.crop))
    setHasFocalPointChanged(false)
    setInputErrors({})
    setImageLoaded(true)
  }

  const fineTuneCrop = ({ dimension, value }: { dimension: 'height' | 'width'; value: string }) => {
    const intValue = Number(value)
    if (value === '' || !Number.isInteger(intValue)) {
      setInputErrors((previous) => ({
        ...previous,
        [dimension]: `${t(dimension === 'width' ? 'upload:width' : 'upload:height')}: ${t('validation:enterNumber')}`,
      }))
      return null
    }
    const percentage =
      100 * (intValue / (dimension === 'width' ? uncroppedPixelWidth : uncroppedPixelHeight))
    if (percentage <= 0 || percentage > 100 - crop[dimension === 'width' ? 'x' : 'y']) {
      setInputErrors((previous) => ({
        ...previous,
        [dimension]: `${t(dimension === 'width' ? 'upload:width' : 'upload:height')}: ${t('validation:invalidInput')}`,
      }))
      return null
    }
    clearInputError({ key: dimension })
    setHasCropChanged(true)
    setCrop((prev) => ({
      ...prev,
      [dimension]: Math.min(percentage, 100 - prev[dimension === 'width' ? 'x' : 'y']),
    }))
  }

  const fineTuneFocalPosition = ({
    coordinate,
    value,
  }: {
    coordinate: 'x' | 'y'
    value: string
  }) => {
    const intValue = Number(value)
    if (value !== '' && Number.isFinite(intValue) && intValue >= 0 && intValue <= 100) {
      clearInputError({ key: `focal${coordinate}` })
      setHasFocalPointChanged(true)
      setFocalPosition((prevPosition) => ({ ...prevPosition, [coordinate]: intValue }))
    } else {
      setInputErrors((previous) => ({
        ...previous,
        [`focal${coordinate}`]: `${t('upload:focalPoint')} ${coordinate.toUpperCase()}: ${t('validation:invalidInput')}`,
      }))
    }
  }

  const fineTuneCropPosition = ({
    coordinate,
    value,
  }: {
    coordinate: 'x' | 'y'
    value: string
  }) => {
    const pixels = Number(value)
    const dimension = coordinate === 'x' ? uncroppedPixelWidth : uncroppedPixelHeight

    if (!Number.isInteger(pixels) || pixels < 0 || pixels >= dimension || value === '') {
      setInputErrors((previous) => ({
        ...previous,
        [coordinate]: `${t('upload:crop')} ${coordinate.toUpperCase()}: ${t('validation:invalidInput')}`,
      }))
      return
    }

    clearInputError({ key: coordinate })
    setHasCropChanged(true)
    setCrop((previous) => {
      const offset = (pixels / dimension) * 100
      const size = coordinate === 'x' ? 'width' : 'height'

      return { ...previous, [coordinate]: offset, [size]: Math.min(previous[size], 100 - offset) }
    })
  }

  function clearInputError({ key }: { key: string }) {
    setInputErrors((previous) => {
      const next = { ...previous }
      delete next[key]

      return next
    })
  }

  function renderInputError({ key }: { key: string }) {
    return inputErrors[key] ? <div role="alert">{inputErrors[key]}</div> : null
  }

  const saveEdits = () => {
    if (Object.keys(inputErrors).length) {
      return
    }
    const transforms = { ...initialTransforms }

    if (showCrop && hasCropChanged) {
      if (crop.x === 0 && crop.y === 0 && crop.width === 100 && crop.height === 100) {
        delete transforms.crop
      } else {
        transforms.crop = toPixelCrop({
          crop,
          height: uncroppedPixelHeight,
          width: uncroppedPixelWidth,
        })
      }
    }
    if (showFocalPoint && hasFocalPointChanged) {
      if (focalPosition.x === 50 && focalPosition.y === 50) {
        delete transforms.focalPoint
      } else {
        transforms.focalPoint = focalPosition
      }
    }

    onSave?.(Object.keys(transforms).length ? transforms : null)
    closeModal(editDrawerSlug)
  }

  const onDragEnd = React.useCallback(({ x, y }) => {
    setFocalPosition({ x, y })
    setHasFocalPointChanged(true)
  }, [])

  const centerFocalPoint = () => {
    setHasFocalPointChanged(true)
    clearInputError({ key: 'focalx' })
    clearInputError({ key: 'focaly' })
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
      <div className={`${baseClass}__body`}>
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
                  onChange={(_, c) => {
                    setHasCropChanged(true)
                    setCrop(c)
                  }}
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
                  className={`${baseClass}__focalPoint`}
                  containerRef={focalWrapRef}
                  initialPosition={focalPosition}
                  onDragEnd={onDragEnd}
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
                    <h3 className={`${baseClass}__section-title`}>{t('upload:crop')}</h3>
                    <button
                      aria-label={t('general:reset')}
                      className={`${baseClass}__reset`}
                      onClick={() => {
                        setHasCropChanged(true)
                        setInputErrors({})
                        setCrop(defaultCrop)
                      }}
                      type="button"
                    >
                      <ResetIcon />
                    </button>
                  </div>
                  <div className={`${baseClass}__fieldset`}>
                    <NumberInput
                      ariaLabel={`${t('upload:crop')} X`}
                      Error={renderInputError({ key: 'x' })}
                      max={imageLoaded ? uncroppedPixelWidth - 1 : undefined}
                      min={0}
                      onChange={(e) =>
                        fineTuneCropPosition({ coordinate: 'x', value: e.target.value })
                      }
                      path="cropX"
                      prefix="X"
                      readOnly={!imageLoaded}
                      showError={Boolean(inputErrors['x'])}
                      size="medium"
                      value={Math.round((crop.x / 100) * uncroppedPixelWidth)}
                    />
                    <NumberInput
                      ariaLabel={`${t('upload:crop')} Y`}
                      Error={renderInputError({ key: 'y' })}
                      max={imageLoaded ? uncroppedPixelHeight - 1 : undefined}
                      min={0}
                      onChange={(e) =>
                        fineTuneCropPosition({ coordinate: 'y', value: e.target.value })
                      }
                      path="cropY"
                      prefix="Y"
                      readOnly={!imageLoaded}
                      showError={Boolean(inputErrors['y'])}
                      size="medium"
                      value={Math.round((crop.y / 100) * uncroppedPixelHeight)}
                    />
                    <NumberInput
                      ariaLabel={t('upload:width')}
                      Error={renderInputError({ key: 'width' })}
                      max={uncroppedPixelWidth - Math.round((crop.x * uncroppedPixelWidth) / 100)}
                      min={1}
                      onChange={(e) => fineTuneCrop({ dimension: 'width', value: e.target.value })}
                      path="cropWidth"
                      prefix="W"
                      readOnly={!imageLoaded}
                      showError={Boolean(inputErrors['width'])}
                      size="medium"
                      value={Number(cropWidthPx)}
                    />
                    <NumberInput
                      ariaLabel={t('upload:height')}
                      Error={renderInputError({ key: 'height' })}
                      max={uncroppedPixelHeight - Math.round((crop.y * uncroppedPixelHeight) / 100)}
                      min={1}
                      onChange={(e) => fineTuneCrop({ dimension: 'height', value: e.target.value })}
                      path="cropHeight"
                      prefix="H"
                      readOnly={!imageLoaded}
                      showError={Boolean(inputErrors['height'])}
                      size="medium"
                      value={Number(cropHeightPx)}
                    />
                  </div>
                </div>
              )}

              {showFocalPoint && (
                <div className={`${baseClass}__section`}>
                  <div className={`${baseClass}__section-header`}>
                    <h3 className={`${baseClass}__section-title`}>{t('upload:focalPoint')}</h3>
                    <button
                      aria-label={t('general:reset')}
                      className={`${baseClass}__reset`}
                      onClick={centerFocalPoint}
                      type="button"
                    >
                      <ResetIcon />
                    </button>
                  </div>
                  <div className={`${baseClass}__fieldset`}>
                    <NumberInput
                      ariaLabel={`${t('upload:focalPoint')} X`}
                      Error={renderInputError({ key: 'focalx' })}
                      max={100}
                      min={0}
                      onChange={(e) =>
                        fineTuneFocalPosition({ coordinate: 'x', value: e.target.value })
                      }
                      path="focalX"
                      prefix="X"
                      showError={Boolean(inputErrors['focalx'])}
                      size="medium"
                      step="any"
                      suffix="%"
                      value={focalPosition.x}
                    />
                    <NumberInput
                      ariaLabel={`${t('upload:focalPoint')} Y`}
                      Error={renderInputError({ key: 'focaly' })}
                      max={100}
                      min={0}
                      onChange={(e) =>
                        fineTuneFocalPosition({ coordinate: 'y', value: e.target.value })
                      }
                      path="focalY"
                      prefix="Y"
                      showError={Boolean(inputErrors['focaly'])}
                      size="medium"
                      step="any"
                      suffix="%"
                      value={focalPosition.y}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
          buttonStyle="secondary"
          disabled={!imageLoaded || Object.keys(inputErrors).length > 0}
          onClick={saveEdits}
        >
          {t('general:applyChanges')}
        </Button>
      </DialogFooter>
    </DialogModal>
  )
}

const DraggableElement = ({
  children,
  className,
  containerRef,
  initialPosition = { x: 50, y: 50 },
  onDragEnd,
}) => {
  const { t } = useTranslation()

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isDragging) {
      return
    }
    const step = event.shiftKey ? 10 : 1
    let { x, y } = positionRef.current

    switch (event.key) {
      case 'ArrowDown':
        y += step
        break
      case 'ArrowLeft':
        x -= step
        break
      case 'ArrowRight':
        x += step
        break
      case 'ArrowUp':
        y -= step
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    const nextPosition = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    }

    positionRef.current = nextPosition
    setPosition(nextPosition)
    onDragEnd(nextPosition)
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

  React.useEffect(() => {
    setPosition({ x: initialPosition.x, y: initialPosition.y })
  }, [initialPosition.x, initialPosition.y])

  return (
    <div className={`${baseClass}__draggable-container`}>
      <button
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
        aria-label={t('upload:setFocalPoint')}
        className={[`${baseClass}__draggable`, className].filter(Boolean).join(' ')}
        onKeyDown={handleKeyDown}
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
