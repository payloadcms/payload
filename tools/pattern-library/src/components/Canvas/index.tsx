import './index.css'

import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

import { useImperativeHandle, useRef } from 'react'
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch'

type CanvasProps = {
  children: React.ReactNode
  ref?: React.RefObject<CanvasHandle | null>
}

export type CanvasHandle = {
  center: () => void
}

function ZoomControls() {
  const { centerView, zoomIn, zoomOut } = useControls()

  return (
    <div className="canvas__controls">
      <button
        className="canvas__ctrl-btn"
        onClick={() => zoomOut(0.25)}
        title="Zoom out"
        type="button"
      >
        −
      </button>
      <button
        className="canvas__ctrl-btn canvas__ctrl-btn--reset"
        onClick={() => centerView(1)}
        title="Reset to 100%"
        type="button"
      >
        100%
      </button>
      <button
        className="canvas__ctrl-btn"
        onClick={() => zoomIn(0.25)}
        title="Zoom in"
        type="button"
      >
        +
      </button>
      <button
        className="canvas__ctrl-btn"
        onClick={() => centerView()}
        title="Fit to view"
        type="button"
      >
        ⊡
      </button>
    </div>
  )
}

export function Canvas({ children, ref }: CanvasProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  useImperativeHandle(ref, () => ({
    center: () => transformRef.current?.centerView(1),
  }))

  return (
    <div className="canvas">
      <TransformWrapper
        centerOnInit
        limitToBounds={false}
        maxScale={5}
        minScale={0.1}
        panning={{ excluded: ['canvas__frame'] }}
        ref={transformRef}
        style={{ height: '100%', width: '100%' }}
      >
        <TransformComponent
          contentClass="canvas__transform-content"
          wrapperClass="canvas__transform-wrapper"
        >
          <div className="canvas__frame">{children}</div>
        </TransformComponent>
        <ZoomControls />
      </TransformWrapper>
    </div>
  )
}
