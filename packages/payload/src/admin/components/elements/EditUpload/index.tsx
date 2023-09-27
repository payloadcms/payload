import type { PixelCrop } from 'react-image-crop'

import React, { useEffect, useRef, useState } from 'react'
import ReactCrop, { type Crop as CropType } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import Plus from '../../icons/Plus'
import { useFormQueryParams } from '../../utilities/FormQueryParams'
import './index.scss'

const baseClass = 'edit-upload'

const EditUpload: React.FC<{ fileSrc: string }> = (props) => {
  const { fileSrc } = props
  const { formQueryParams, setFormQueryParams } = useFormQueryParams()
  const [crop, setCrop] = useState<CropType>(null)
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>(null)
  const [output, setOutput] = useState<null | string>(null)
  const [pointPosition, setPointPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const offsetRef = useRef({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | undefined>()
  const cropRef = useRef<HTMLImageElement | undefined>()

  // Calculate original dimensions as a fraction of the total size
  const originalHeight = cropRef.current ? cropRef.current.naturalHeight / 100 : 0
  const originalWidth = cropRef.current ? cropRef.current.naturalWidth / 100 : 0

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        let x = ((e.clientX - offsetRef.current.x - rect.left) / rect.width) * 100
        let y = ((e.clientY - offsetRef.current.y - rect.top) / rect.height) * 100

        x = Math.max(0, Math.min(100, x))
        y = Math.max(0, Math.min(100, y))

        setPointPosition({ x, y })

        setFormQueryParams({
          ...formQueryParams,
          uploadEdits: {
            ...formQueryParams.uploadEdits,
            focalPoint: { x: x, y: y },
          },
        })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setFormQueryParams])

  const handlePointMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      offsetRef.current = {
        x: e.clientX - rect.left - (pointPosition.x / 100) * rect.width,
        y: e.clientY - rect.top - (pointPosition.y / 100) * rect.height,
      }
      setIsDragging(true)
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDragging && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      let x = ((e.clientX - rect.left) / rect.width) * 100
      let y = ((e.clientY - rect.top) / rect.height) * 100

      x = Math.max(0, Math.min(100, x))
      y = Math.max(0, Math.min(100, y))

      setPointPosition({ x, y })

      setFormQueryParams({
        ...formQueryParams,
        uploadEdits: {
          ...formQueryParams.uploadEdits,
          focalPoint: { x: x, y: y },
        },
      })
    }
  }

  useEffect(() => {
    if (completedCrop) {
      setFormQueryParams({
        ...formQueryParams,
        uploadEdits: { ...formQueryParams.uploadEdits, crop: completedCrop },
      })
    }
  }, [completedCrop, setFormQueryParams])

  const handleDimensionChange = (dimensionName: string, value: string) => {
    const val = parseFloat(value) / (dimensionName === 'width' ? originalWidth : originalHeight)
    if (val >= 0 && val <= 100) {
      setCrop({
        ...crop,
        [dimensionName]: val,
      })
    }
  }

  const generateCroppedPreview = async (cropData: CropType | null) => {
    try {
      if (!cropData.width || !cropData.height || !cropRef.current) {
        return null
      }

      const { height, width, x, y } = cropData

      const img = new Image()
      img.src = fileSrc

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const canvasWidth = width * originalWidth
      const canvasHeight = height * originalHeight

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      ctx.drawImage(
        img,
        x * originalWidth,
        y * originalHeight,
        canvasWidth,
        canvasHeight,
        0,
        0,
        canvasWidth,
        canvasHeight,
      )

      const croppedDataURL = canvas.toDataURL('image/png')

      return croppedDataURL
    } catch (error) {
      console.error('Error generating cropped preview:', error)
      throw error
    }
  }

  const handleCropComplete = async (newCrop: CropType | null) => {
    setCompletedCrop(newCrop)

    if (!newCrop) return

    const data = await generateCroppedPreview(newCrop)
    setOutput(data)
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__toolWrap`}>
        <ReactCrop
          className={`${baseClass}__crop`}
          crop={crop}
          onChange={(_, c) => setCrop(c)}
          onComplete={(_, c) => handleCropComplete(c)}
        >
          <img alt="Upload Preview" ref={cropRef} src={fileSrc} />
        </ReactCrop>

        <div className={`${baseClass}__focalPoint`}>
          <img
            alt="Crop Preview and Focal Point selection"
            className={`${baseClass}__imageRef`}
            onClick={handleImageClick}
            ref={imageRef}
            role="presentation"
            src={output || fileSrc}
          />
          <div
            className={`${baseClass}__point`}
            onMouseDown={handlePointMouseDown}
            role="presentation"
            style={{ left: `${pointPosition.x}%`, top: `${pointPosition.y}%` }}
          >
            <Plus />
          </div>
        </div>
      </div>
      <div className={`${baseClass}__sidebar`}>
        <div>
          <h3>Crop</h3>
          <div className={`${baseClass}__inputsWrap`}>
            <div className={`${baseClass}__input`}>
              Width (px)
              <input
                name="width"
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                type="number"
                value={(originalWidth * (crop?.width || 0)).toFixed(0)}
              />
            </div>
            <div className={`${baseClass}__input`}>
              Height (px)
              <input
                name="height"
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                type="number"
                value={(originalHeight * (crop?.height || 0)).toFixed(0)}
              />
            </div>
          </div>
        </div>
        <div>
          <h3>Focal Point</h3>
          <div className={`${baseClass}__inputsWrap`}>
            <div className={`${baseClass}__input`}>
              X %
              <input
                name="x"
                onChange={(e) => {
                  const x = parseInt(e.target.value)
                  if (x >= 0 && x <= 100) {
                    setPointPosition({ ...pointPosition, x })
                  }
                }}
                type="number"
                value={pointPosition.x.toFixed(0)}
              />
            </div>
            <div className={`${baseClass}__input`}>
              Y %
              <input
                name="y"
                onChange={(e) => {
                  const y = parseInt(e.target.value)
                  if (y >= 0 && y <= 100) {
                    setPointPosition({ ...pointPosition, y })
                  }
                }}
                type="number"
                value={pointPosition.y.toFixed(0)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUpload
