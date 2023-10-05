import { useModal } from '@faceless-ui/modal'
import { t } from 'i18next'
import React, { useRef, useState } from 'react'
import ReactCrop, { type Crop as CropType } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import type { Data } from '../../forms/Form/types'

import Plus from '../../icons/Plus'
import { useFormQueryParams } from '../../utilities/FormQueryParams'
import { editDrawerSlug } from '../../views/collections/Edit/Upload'
import Button from '../Button'
import './index.scss'

const baseClass = 'edit-upload'

const Input: React.FC<{ name: string; onChange: (value: string) => void; value: string }> = ({
  name,
  onChange,
  value,
}) => (
  <div className={`${baseClass}__input`}>
    {name}
    <input name={name} onChange={(e) => onChange(e.target.value)} type="number" value={value} />
  </div>
)

const EditUpload: React.FC<{
  doc?: Data
  fileName: string
  fileSrc: string
  showCrop?: boolean
  showFocalPoint?: boolean
}> = ({ fileName, fileSrc, showCrop, showFocalPoint }) => {
  const { closeModal } = useModal()

  const { formQueryParams, setFormQueryParams } = useFormQueryParams()
  const { uploadEdits } = formQueryParams || {}
  const [crop, setCrop] = useState<CropType>({
    height: uploadEdits?.crop?.height || 100,
    unit: '%',
    width: uploadEdits?.crop?.width || 100,
    x: uploadEdits?.crop?.x || 0,
    y: uploadEdits?.crop?.y || 0,
  })

  const [pointPosition, setPointPosition] = useState<{ x: number; y: number }>({
    x: uploadEdits?.focalPoint?.x || 50,
    y: uploadEdits?.focalPoint?.y || 50,
  })
  const [checkBounds, setCheckBounds] = useState<boolean>(false)

  const focalWrapRef = useRef<HTMLDivElement | undefined>()
  const imageRef = useRef<HTMLImageElement | undefined>()
  const cropRef = useRef<HTMLDivElement | undefined>()

  const originalHeight = imageRef.current ? imageRef.current.naturalHeight / 100 : 0
  const originalWidth = imageRef.current ? imageRef.current.naturalWidth / 100 : 0

  const handleInputChange = (name: string, value: string) => {
    if (name === 'width' || name === 'height') {
      const dimension = name === 'width' ? 'width' : 'height'
      const val = parseFloat(value) / (dimension === 'width' ? originalWidth : originalHeight)

      const maxCrop = {
        height: (crop.y + val).toFixed(0) >= 100,
        width: (crop.x + val).toFixed(0) >= 100,
      }

      const maxReached =
        dimension === 'height'
          ? crop.y === 0 && crop.height >= 100
          : crop.x === 0 && crop.width >= 100

      if (maxReached) return null

      const updatedCrop = {
        ...crop,
        [dimension]: val,
        ...(maxCrop.width && name === 'width' ? { x: 100 - val } : {}),
        ...(maxCrop.height && name === 'height' ? { y: 100 - val } : {}),
      }

      setCrop(updatedCrop)
    } else if (name === 'x' || name === 'y') {
      const coordinate = name === 'x' ? 'x' : 'y'
      const newValue = parseInt(value)
      if (newValue >= 0 && newValue <= 100) {
        setPointPosition((prevPosition) => ({ ...prevPosition, [coordinate]: newValue }))
      }
    }
  }

  const saveEdits = () => {
    setFormQueryParams({
      ...formQueryParams,
      uploadEdits: {
        crop: crop ? crop : undefined,
        focalPoint: pointPosition ? pointPosition : undefined,
      },
    })
    closeModal(editDrawerSlug)
  }

  const onDragEnd = React.useCallback(({ x, y }) => {
    setPointPosition({ x, y })
    setCheckBounds(false)
  }, [])

  const centerFocalPoint = () => {
    const containerRect = focalWrapRef.current.getBoundingClientRect()
    const boundsRect = cropRef.current.getBoundingClientRect()
    const xCenter =
      ((boundsRect.left - containerRect.left + boundsRect.width / 2) / containerRect.width) * 100
    const yCenter =
      ((boundsRect.top - containerRect.top + boundsRect.height / 2) / containerRect.height) * 100
    setPointPosition({ x: xCenter, y: yCenter })
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h2>Editing {fileName}</h2>
        <div className={`${baseClass}__actions`}>
          <Button
            aria-label={t('close')}
            buttonStyle="secondary"
            className={`${baseClass}__cancel`}
            onClick={() => closeModal(editDrawerSlug)}
          >
            Cancel
          </Button>
          <Button
            buttonStyle="primary"
            className={`${baseClass}__save`}
            onClick={() => saveEdits()}
          >
            Apply Changes
          </Button>
        </div>
      </div>
      <div className={`${baseClass}__toolWrap`}>
        <div className={`${baseClass}__crop`}>
          <div
            className={`${baseClass}__focal-wrapper`}
            ref={focalWrapRef}
            style={{
              aspectRatio: `${originalWidth / originalHeight}`,
            }}
          >
            {showCrop ? (
              <ReactCrop
                className={`${baseClass}__reactCrop`}
                crop={crop}
                onChange={(_, c) => setCrop(c)}
                onComplete={() => setCheckBounds(true)}
                renderSelectionAddon={() => {
                  return <div className={`${baseClass}__crop-window`} ref={cropRef} />
                }}
              >
                <img alt="Upload Preview" ref={imageRef} src={fileSrc} />
              </ReactCrop>
            ) : (
              <img alt="Upload Preview" ref={imageRef} src={fileSrc} />
            )}
            <DraggableElement
              boundsRef={cropRef}
              checkBounds={checkBounds}
              className={`${baseClass}__focalPoint`}
              containerRef={focalWrapRef}
              initialPosition={pointPosition}
              onDragEnd={onDragEnd}
              setCheckBounds={setCheckBounds}
            >
              <Plus />
            </DraggableElement>
          </div>
        </div>
        {(showCrop || showFocalPoint) && (
          <div className={`${baseClass}__sidebar`}>
            {showCrop && (
              <div className={`${baseClass}__groupWrap`}>
                <div>
                  <div className={`${baseClass}__titleWrap`}>
                    <h3>Crop</h3>
                    <Button
                      buttonStyle="none"
                      className={`${baseClass}__reset`}
                      onClick={() =>
                        setCrop({
                          height: 100,
                          unit: '%',
                          width: 100,
                          x: 0,
                          y: 0,
                        })
                      }
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <span className={`${baseClass}__description`}>
                  Draw an area to crop, adjust by dragging the corners or updating the values below.
                </span>
                <div className={`${baseClass}__inputsWrap`}>
                  <Input
                    name="Width (px)"
                    onChange={(value) => handleInputChange('width', value)}
                    value={(originalWidth * crop.width).toFixed(0)}
                  />
                  <Input
                    name="Height (px)"
                    onChange={(value) => handleInputChange('height', value)}
                    value={(originalHeight * crop.height).toFixed(0)}
                  />
                </div>
              </div>
            )}

            {showFocalPoint && (
              <div className={`${baseClass}__groupWrap`}>
                <div>
                  <div className={`${baseClass}__titleWrap`}>
                    <h3>Focal Point</h3>
                    <Button
                      buttonStyle="none"
                      className={`${baseClass}__reset`}
                      onClick={centerFocalPoint}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <span className={`${baseClass}__description`}>
                  Click within the cropped area to position the focal point or adjust the values
                  below.
                </span>
                <div className={`${baseClass}__inputsWrap`}>
                  <Input
                    name="X %"
                    onChange={(value) => handleInputChange('x', value)}
                    value={pointPosition.x.toFixed(0)}
                  />
                  <Input
                    name="Y %"
                    onChange={(value) => handleInputChange('y', value)}
                    value={pointPosition.y.toFixed(0)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EditUpload

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
  const dragRef = useRef<HTMLDivElement | undefined>()

  const getCoordinates = React.useCallback(
    (mouseXArg?: number, mouseYArg?: number, recenter?: boolean) => {
      const containerRect = containerRef.current.getBoundingClientRect()
      const boundsRect = boundsRef.current.getBoundingClientRect()
      const mouseX = mouseXArg ?? boundsRect.left
      const mouseY = mouseYArg ?? boundsRect.top

      const xOutOfBounds = mouseX < boundsRect.left || mouseX > boundsRect.right
      const yOutOfBounds = mouseY < boundsRect.top || mouseY > boundsRect.bottom

      let x = ((mouseX - containerRect.left) / containerRect.width) * 100
      let y = ((mouseY - containerRect.top) / containerRect.height) * 100
      const xCenter =
        ((boundsRect.left - containerRect.left + boundsRect.width / 2) / containerRect.width) * 100
      const yCenter =
        ((boundsRect.top - containerRect.top + boundsRect.height / 2) / containerRect.height) * 100
      if (xOutOfBounds || yOutOfBounds) {
        setIsDragging(false)
        if (mouseX < boundsRect.left) {
          x = ((boundsRect.left - containerRect.left) / containerRect.width) * 100
        } else if (mouseX > boundsRect.right) {
          x =
            ((containerRect.width - (containerRect.right - boundsRect.right)) /
              containerRect.width) *
            100
        }

        if (mouseY < boundsRect.top) {
          y = ((boundsRect.top - containerRect.top) / containerRect.height) * 100
        } else if (mouseY > boundsRect.bottom) {
          y =
            ((containerRect.height - (containerRect.bottom - boundsRect.bottom)) /
              containerRect.height) *
            100
        }

        if (recenter) {
          x = xOutOfBounds ? xCenter : x
          y = yOutOfBounds ? yCenter : y
        }
      }

      return { x, y }
    },
    [],
  )

  const handleMouseDown = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = (event) => {
    if (!isDragging) return null
    const { x, y } = getCoordinates(event.clientX, event.clientY)

    setPosition({ x, y })
  }

  const onDrop = () => {
    setIsDragging(false)
    onDragEnd(position)
  }

  React.useEffect(() => {
    if (isDragging || !dragRef.current) return
    if (checkBounds) {
      const { height, left, top, width } = dragRef.current.getBoundingClientRect()
      const { x, y } = getCoordinates(left + width / 2, top + height / 2, true)
      onDragEnd({ x, y })
      setPosition({ x, y })
      setCheckBounds(false)
      return
    }
  }, [getCoordinates, isDragging, checkBounds, setCheckBounds, position.x, position.y])

  React.useEffect(() => {
    setPosition({ x: initialPosition.x, y: initialPosition.y })
  }, [initialPosition.x, initialPosition.y])

  return (
    <div
      className={[
        `${baseClass}__draggable-container`,
        isDragging && `${baseClass}__draggable-container--dragging`,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseMove={handleMouseMove}
    >
      <div
        className={[`${baseClass}__draggable`, className].filter(Boolean).join(' ')}
        onMouseDown={handleMouseDown}
        onMouseUp={onDrop}
        ref={dragRef}
        style={{ left: `${position.x}%`, position: 'absolute', top: `${position.y}%` }}
      >
        {children}
      </div>
      <div />
    </div>
  )
}
