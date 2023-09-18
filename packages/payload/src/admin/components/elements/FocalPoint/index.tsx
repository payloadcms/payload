import React, { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom' // Import useHistory and useLocation from React Router
import Plus from '../../icons/Plus'

import './index.scss'

const baseClass = 'focal-point'

const FocalPoint: React.FC<{
  fileSrc: string
  value: any
}> = (props) => {
  const { fileSrc, value } = props

  const [pointPosition, setPointPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)

  const offsetRef = useRef({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)

  const history = useHistory() // Access the history object
  const location = useLocation() // Access the location object

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        let x = ((e.clientX - offsetRef.current.x - rect.left) / rect.width) * 100
        let y = ((e.clientY - offsetRef.current.y - rect.top) / rect.height) * 100

        // Keep x and y within 0-100
        x = Math.max(0, Math.min(100, x))
        y = Math.max(0, Math.min(100, y))

        setPointPosition({ x, y })

        // Update the URL with the new x and y values as query parameters
        const searchParams = new URLSearchParams(location.search)
        searchParams.set('x', x.toFixed(0))
        searchParams.set('y', y.toFixed(0))
        history.replace({ search: searchParams.toString() })
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

      // Update the URL with the new x and y values as query parameters
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('x', x.toFixed(0))
      searchParams.set('y', y.toFixed(0))
      history.replace({ search: searchParams.toString() })
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
                  // Update the URL with the new x value as a query parameter
                  const searchParams = new URLSearchParams(location.search)
                  searchParams.set('x', x.toFixed(0))
                  history.replace({ search: searchParams.toString() })
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
                  // Update the URL with the new y value as a query parameter
                  const searchParams = new URLSearchParams(location.search)
                  searchParams.set('y', y.toFixed(0))
                  history.replace({ search: searchParams.toString() })
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
