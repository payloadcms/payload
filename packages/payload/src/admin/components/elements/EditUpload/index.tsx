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
}> = ({ fileName, fileSrc, showCrop, showFocalPoint: hasFocalPoint }) => {
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

  const [isDragging, setIsDragging] = useState<boolean>(false)
  const showFocalPoint = hasFocalPoint && !isDragging

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
        ...(maxCrop.width && name !== 'height' ? { x: 100 - val } : {}),
        ...(maxCrop.height && name !== 'width' ? { y: 100 - val } : {}),
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

  const setFocalPoint = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect =
      cropRef.current?.getBoundingClientRect() || imageRef.current?.getBoundingClientRect()

    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    setPointPosition({ x, y })
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
        {showCrop ? (
          <div className={`${baseClass}__crop`}>
            <ReactCrop
              className={`${baseClass}__reactCrop`}
              crop={crop}
              onChange={(_, c) => setCrop(c)}
              onDragEnd={() => setIsDragging(false)}
              onDragStart={() => setIsDragging(true)}
              renderSelectionAddon={() => {
                return (
                  <div
                    className={`${baseClass}__focalPoint`}
                    onClick={setFocalPoint}
                    ref={cropRef}
                    role="presentation"
                  >
                    <div
                      className={`${baseClass}__point`}
                      style={{
                        left: `${pointPosition.x}%`,
                        opacity: showFocalPoint ? 1 : 0,
                        top: `${pointPosition.y}%`,
                      }}
                    >
                      <Plus />
                    </div>
                  </div>
                )
              }}
            >
              <img alt="Upload Preview" ref={imageRef} src={fileSrc} />
            </ReactCrop>
          </div>
        ) : (
          <div className={`${baseClass}__focalOnly`}>
            <div
              className={`${baseClass}__imageWrap`}
              onClick={setFocalPoint}
              ref={cropRef}
              role="presentation"
            >
              <img alt="Upload Preview" ref={imageRef} src={fileSrc} />
              <div
                className={`${baseClass}__point`}
                style={{
                  left: `${pointPosition.x}%`,
                  opacity: showFocalPoint ? 1 : 0,
                  top: `${pointPosition.y}%`,
                }}
              >
                <Plus />
              </div>
            </div>
          </div>
        )}
        <div className={`${baseClass}__sidebar`}>
          {showCrop && (
            <div className={`${baseClass}__groupWrap`}>
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
              <div className={`${baseClass}__titleWrap`}>
                <h3>Focal Point</h3>
                <Button
                  buttonStyle="none"
                  className={`${baseClass}__reset`}
                  onClick={() => setPointPosition({ x: 50, y: 50 })}
                >
                  Reset
                </Button>
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
      </div>
    </div>
  )
}

export default EditUpload
