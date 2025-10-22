import { toast, useConfig, usePreferences } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import type { WidgetInstanceClient, WidgetItem } from './client.js'

import { RenderWidget } from './renderWidget/RenderWidget.js'

export function useDashboardLayout(initialLayout: WidgetInstanceClient[]) {
  const setLayoutPreference = useSetLayoutPreference()
  const [isEditing, setIsEditing] = useState(false)
  const { widgets = [] } = useConfig().config.admin.dashboard ?? {}
  const [currentLayout, setCurrentLayout] = useState<WidgetInstanceClient[]>(initialLayout)

  const saveLayout = useCallback(async () => {
    try {
      const layoutData: WidgetItem[] = currentLayout.map((item) => item.item)
      setIsEditing(false)
      await setLayoutPreference(layoutData)
    } catch {
      setIsEditing(true)
      toast.error('Failed to save layout')
    }
  }, [setLayoutPreference, currentLayout])

  const resetLayout = useCallback(async () => {
    try {
      await setLayoutPreference(null)
      setIsEditing(false)
      // Reload to get default layout from server
      // TO-DECIDE: should we send the default layout from server to prevent a reload?
      window.location.reload()
    } catch {
      // Handle error silently or show user feedback
    }
  }, [setLayoutPreference])

  const cancel = useCallback(() => {
    // Restore initial layout
    setCurrentLayout(initialLayout)
    setIsEditing(false)
  }, [initialLayout])

  const handleDragEnd = useCallback(
    ({ moveFromIndex, moveToIndex }: { moveFromIndex: number; moveToIndex: number }) => {
      if (!isEditing || moveFromIndex === moveToIndex) {
        return
      }

      setCurrentLayout((prev) => {
        const newLayout = [...prev]
        const [movedItem] = newLayout.splice(moveFromIndex, 1)
        newLayout.splice(moveToIndex, 0, movedItem)
        return newLayout
      })
    },
    [isEditing],
  )

  const addWidget = useCallback(
    (widgetSlug: string) => {
      if (!isEditing) {
        return
      }

      const widgetId = `${widgetSlug}-${Date.now()}`
      const widget = widgets.find((w) => w.slug === widgetSlug)

      // Create a new widget instance using RenderWidget (Lexical pattern)
      const newWidgetInstance: WidgetInstanceClient = {
        component: React.createElement(RenderWidget, {
          widgetId,
          // TODO: widgetData can be added here for custom props
        }),
        item: {
          i: widgetId,
          maxW: widget?.maxWidth ?? 12,
          minW: widget?.minWidth ?? 3,
          resizeHandles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
          w: widget?.minWidth ?? 3,
          x: 0, // Will be positioned automatically by react-grid-layout
          y: 0, // Will be positioned automatically by react-grid-layout
        },
      }

      setCurrentLayout((prev) => [...prev, newWidgetInstance])
    },
    [isEditing, currentLayout],
  )

  const deleteWidget = useCallback(
    (widgetId: string) => {
      if (!isEditing) {
        return
      }
      setCurrentLayout((prev) => prev.filter((item) => item.item.i !== widgetId))
    },
    [isEditing],
  )

  return {
    addWidget,
    cancel,
    currentLayout,
    deleteWidget,
    handleDragEnd,
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
  }
}

function useSetLayoutPreference() {
  const { setPreference } = usePreferences()
  return useCallback(
    async (layout: null | WidgetItem[]) => {
      await setPreference('dashboard-layout', { layouts: layout }, false)
    },
    [setPreference],
  )
}
