'use client'

import type { ClientWidget } from 'payload'

import { useDraggable } from '@dnd-kit/core'
import React, { useMemo } from 'react'

import type { ThumbnailCardProps } from '../../ThumbnailCard/index.js'

import { ThumbnailCard } from '../../ThumbnailCard/index.js'

export function DraggableWidgetCard({
  drawerSlug,
  widget,
  ...cardProps
}: { drawerSlug: string; widget: ClientWidget } & ThumbnailCardProps) {
  const draggableArgs = useMemo(
    () => ({
      id: `dashboard-picker:${widget.slug}:source`,
      data: { type: 'dashboard-widget', drawerSlug, widget },
    }),
    [drawerSlug, widget],
  )
  const { attributes, listeners, setNodeRef } = useDraggable(draggableArgs)

  return (
    <ThumbnailCard
      {...cardProps}
      className="thumbnail-card--draggable"
      extraButtonProps={{ ...attributes, ...listeners, id: draggableArgs.id, ref: setNodeRef }}
    />
  )
}
