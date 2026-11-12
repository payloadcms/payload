'use client'

import type { WidgetWidth } from 'payload'
import type { PointerEvent } from 'react'

import { useEffect, useRef } from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import { getResizedWidgetWidth, WIDTH_TO_PERCENTAGE } from '../utils/resizeWidget.js'
import './index.css'

type ResizeSession = {
  containerWidth: number
  currentWidth: WidgetWidth
  direction: number
  element: HTMLDivElement
  pointerID: number
  startWidth: WidgetWidth
  startX: number
}

export function WidgetResizeHandles({
  maxWidth,
  minWidth,
  onResize,
  widgetLabel,
  width,
}: {
  maxWidth: WidgetWidth
  minWidth: WidgetWidth
  onResize: (args: { width: WidgetWidth }) => void
  widgetLabel: string
  width: WidgetWidth
}) {
  const { t } = useTranslation()
  const sessionRef = useRef<null | ResizeSession>(null)

  useEffect(
    () => () => {
      document.body.classList.remove('is-resizing-widgets')
    },
    [],
  )

  if (minWidth === maxWidth) {
    return null
  }

  const finishResize = ({
    pointerID,
    shouldCancel = false,
  }: { pointerID?: number; shouldCancel?: boolean } = {}) => {
    const session = sessionRef.current

    if (!session || (pointerID !== undefined && pointerID !== session.pointerID)) {
      return
    }

    sessionRef.current = null
    document.body.classList.remove('is-resizing-widgets')
    if (shouldCancel) {
      onResize({ width: session.startWidth })
    }
    if (session.element.hasPointerCapture(session.pointerID)) {
      session.element.releasePointerCapture(session.pointerID)
    }
  }

  const updateResize = (event: PointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current

    if (!session || session.pointerID !== event.pointerId) {
      return
    }

    const nextWidth = getResizedWidgetWidth({
      containerWidth: session.containerWidth,
      delta: (event.clientX - session.startX) * session.direction,
      maxWidth,
      minWidth,
      startWidth: session.startWidth,
    })

    if (nextWidth !== session.currentWidth) {
      session.currentWidth = nextWidth
      onResize({ width: nextWidth })
    }
  }

  return (
    <div className="widget-wrapper__resize-handles">
      {(['start', 'end'] as const).map((edge) => (
        <div
          aria-label={t('dashboard:resizeWidget', { label: widgetLabel, size: width })}
          aria-orientation="horizontal"
          aria-valuemax={WIDTH_TO_PERCENTAGE[maxWidth]}
          aria-valuemin={WIDTH_TO_PERCENTAGE[minWidth]}
          aria-valuenow={WIDTH_TO_PERCENTAGE[width]}
          aria-valuetext={width}
          className={`widget-resize-handle widget-resize-handle--${edge}`}
          key={edge}
          onBlur={() => finishResize()}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && sessionRef.current) {
              event.preventDefault()
              event.stopPropagation()
              finishResize({ shouldCancel: true })
              return
            }

            const options = (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[]).filter(
              (option) =>
                WIDTH_TO_PERCENTAGE[option] >= WIDTH_TO_PERCENTAGE[minWidth] &&
                WIDTH_TO_PERCENTAGE[option] <= WIDTH_TO_PERCENTAGE[maxWidth],
            )
            const index = options.indexOf(width)
            const nextWidth =
              event.key === 'Home'
                ? options[0]
                : event.key === 'End'
                  ? options.at(-1)
                  : event.key === 'ArrowRight' || event.key === 'ArrowUp'
                    ? options[index + 1]
                    : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                      ? options[index - 1]
                      : undefined

            if (
              ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home'].includes(event.key)
            ) {
              event.preventDefault()
              event.stopPropagation()
              if (nextWidth) {
                onResize({ width: nextWidth })
              }
            }
          }}
          onLostPointerCapture={(event) => finishResize({ pointerID: event.pointerId })}
          onPointerCancel={(event) =>
            finishResize({ pointerID: event.pointerId, shouldCancel: true })
          }
          onPointerDown={(event) => {
            if (event.button !== 0 || sessionRef.current) {
              return
            }

            const dashboard = event.currentTarget.closest('.modular-dashboard')
            const containerWidth = dashboard?.getBoundingClientRect().width

            if (!containerWidth) {
              return
            }

            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.focus({ preventScroll: true })
            const isRTL = getComputedStyle(event.currentTarget).direction === 'rtl'

            sessionRef.current = {
              containerWidth,
              currentWidth: width,
              direction: (edge === 'end' ? 1 : -1) * (isRTL ? -1 : 1),
              element: event.currentTarget,
              pointerID: event.pointerId,
              startWidth: width,
              startX: event.clientX,
            }
            event.currentTarget.setPointerCapture(event.pointerId)
            document.body.classList.add('is-resizing-widgets')
          }}
          onPointerMove={updateResize}
          onPointerUp={(event) => {
            updateResize(event)
            finishResize({ pointerID: event.pointerId })
          }}
          role="slider"
          tabIndex={0}
        />
      ))}
    </div>
  )
}
