// @vitest-environment jsdom
import type { DragEndEvent } from '@dnd-kit/core'

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import React, { act, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { closestInXAxis } from '../../../views/Dashboard/Default/ModularDashboard/utils/collisionDetection.js'
import { DraggableWidgetCard } from './index.js'

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { admin: {} } }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('should retain the drag and accept a dashboard target after the drawer source unmounts', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  const container = document.createElement('div')

  document.body.append(container)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const isTarget = this.id === 'target-row-after'
    const left = 0
    const top = isTarget ? 300 : 0
    const width = isTarget ? 600 : 168
    const height = isTarget ? 48 : 200

    return {
      bottom: top + height,
      height,
      left,
      right: left + width,
      top,
      width,
      x: left,
      y: top,
      toJSON: () => ({}),
    }
  })
  const onDrop = vi.fn<(event: DragEndEvent) => void>()
  const root = createRoot(container)
  function Target() {
    const args = useMemo(() => ({ id: 'target-row-after', data: { position: 'row-after' } }), [])
    const { setNodeRef } = useDroppable(args)

    return React.createElement('div', { id: 'target-row-after', ref: setNodeRef })
  }
  function Harness() {
    const [isOpen, setIsOpen] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }))

    return React.createElement(
      DndContext,
      {
        sensors,
        autoScroll: false,
        collisionDetection: closestInXAxis,
        onDragStart: () => {
          setIsDragging(true)
          requestAnimationFrame(() => setIsOpen(false))
        },
        onDragEnd: onDrop,
      },
      isOpen
        ? React.createElement(DraggableWidgetCard, {
            drawerSlug: 'widgets',
            widget: { slug: 'count' },
            label: 'Count Widget',
            thumbnail: null,
          })
        : null,
      React.createElement(Target),
      React.createElement(
        DragOverlay,
        { dropAnimation: null },
        isDragging ? React.createElement('div', { 'data-preview': true }, 'Count Widget') : null,
      ),
    )
  }
  const mouse = async ({
    type,
    x,
    y,
    element = document,
  }: {
    type: string
    x: number
    y: number
    element?: EventTarget
  }) => {
    await act(async () => {
      element.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          button: 0,
          buttons: type === 'mouseup' ? 0 : 1,
          clientX: x,
          clientY: y,
        }),
      )
    })
  }

  try {
    await act(async () => root.render(React.createElement(Harness)))
    const source = container.querySelector('button')!

    await mouse({ element: source, type: 'mousedown', x: 50, y: 50 })
    await mouse({ type: 'mousemove', x: 65, y: 50 })
    await act(async () => vi.advanceTimersByTime(30))
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[data-preview]')).not.toBeNull()
    await mouse({ type: 'mousemove', x: 300, y: 324 })
    await mouse({ type: 'mouseup', x: 300, y: 324 })
    expect(onDrop).toHaveBeenCalledOnce()
    expect(onDrop.mock.calls[0][0].over?.id).toBe('target-row-after')
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
