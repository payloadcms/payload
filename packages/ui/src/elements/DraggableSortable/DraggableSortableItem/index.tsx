'use client'
import type { UseDraggableArguments } from '@dnd-kit/core'

import React, { Fragment, useEffect, useState } from 'react'

import type { ChildFunction } from './types.js'

import { useDraggableSortable } from '../useDraggableSortable/index.js'

function useClient() {
  const [isClient, setClient] = useState<boolean>(false)
  useEffect(() => {
    setClient(true)
  }, [])
  return isClient
}

export const DraggableSortableItem: React.FC<
  {
    children: ChildFunction
  } & UseDraggableArguments
> = (props) => {
  const { id, children, disabled } = props

  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useDraggableSortable({
      id,
      disabled,
    })

  const isClient = useClient()

  if (!isClient) {
    // Skip server-side rendering to avoid hydration error of aria attributes
    return null
  }

  return (
    <Fragment>
      {children({
        attributes: {
          ...attributes,
          style: {
            cursor: isDragging ? 'grabbing' : 'grab',
          },
        },
        isDragging,
        listeners,
        setNodeRef,
        transform,
        transition,
      })}
    </Fragment>
  )
}
