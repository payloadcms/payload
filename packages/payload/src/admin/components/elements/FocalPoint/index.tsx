import React, { useState, useEffect, useRef } from 'react'
import Plus from '../../icons/Plus'

import './index.scss'
import { set } from 'date-fns'

const baseClass = 'focal-point'

const FocalPoint: React.FC<{
  fileSrc: string
  setFocalPoint: (focalPoint: { x: number; y: number }) => void
  value: any
}> = (props) => {
  const { fileSrc, value, setFocalPoint } = props

  const [pointPosition, setPointPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)

  const offsetRef = useRef({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        let x = ((e.clientX - offsetRef.current.x - rect.left) / rect.width) * 100
        let y = ((e.clientY - offsetRef.current.y - rect.top) / rect.height) * 100

        x = Math.max(0, Math.min(100, x))
        y = Math.max(0, Math.min(100, y))

        setPointPosition({ x, y })
        setFocalPoint({ x, y })
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
  }, [isDragging, history, location.search])

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
      setFocalPoint({ x, y })
    }
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__imageWrap`}>
        <div className={`${baseClass}__imageRef`}>
          <img ref={imageRef} alt={value.name} src={fileSrc} onClick={handleImageClick} />
          <div
            className={`${baseClass}__point`}
            style={{ left: `${pointPosition.x}%`, top: `${pointPosition.y}%` }}
            onMouseDown={handlePointMouseDown}
          >
            <Plus />
          </div>
        </div>
      </div>
      <div className={`${baseClass}__sidebar`}>
        <h3>Focal Point</h3>
        <div className={`${baseClass}__coordinates`}>
          <div className={`${baseClass}__x`}>
            X %
            <input
              name="x"
              type="number"
              value={pointPosition.x.toFixed(0)}
              onChange={(e) => {
                const x = parseInt(e.target.value)
                if (x >= 0 && x <= 100) {
                  setPointPosition({ ...pointPosition, x })
                }
              }}
            />
          </div>
          <div className={`${baseClass}__y`}>
            Y %
            <input
              name="y"
              type="number"
              value={pointPosition.y.toFixed(0)}
              onChange={(e) => {
                const y = parseInt(e.target.value)
                if (y >= 0 && y <= 100) {
                  setPointPosition({ ...pointPosition, y })
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FocalPoint
