import { useCallback, useRef, useState } from 'react'

type UseResizeOptions = {
  defaultWidth: number
  direction: 'left' | 'right'
  maxWidth: number
  minWidth: number
}

export function useResize({ defaultWidth, direction, maxWidth, minWidth }: UseResizeOptions) {
  const [width, setWidth] = useState(defaultWidth)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = width

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta =
          direction === 'right'
            ? moveEvent.clientX - startXRef.current
            : startXRef.current - moveEvent.clientX
        const next = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta))
        setWidth(next)
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [direction, maxWidth, minWidth, width],
  )

  return { onMouseDown, width }
}
