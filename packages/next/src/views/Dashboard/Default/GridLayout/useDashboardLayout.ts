import type { Layout } from 'react-grid-layout'

import { toast, useConfig, usePreferences } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import type { WidgetInstanceClient } from './client.js'

import { RenderWidget } from './renderWidget/RenderWidget.js'

export function useDashboardLayout(initialLayout: WidgetInstanceClient[]) {
  const setLayoutPreference = useSetLayoutPreference()
  const [isEditing, setIsEditing] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<WidgetInstanceClient[]>(initialLayout)
  const { widgets = [] } = useConfig().config.admin.dashboard ?? {}

  const saveLayout = useCallback(async () => {
    try {
      const layoutData: Layout[] = currentLayout.map((item) => item.clientLayout)
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

  // Handle layout changes from react-grid-layout while preserving components
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (isEditing) {
        // Merge new layout positions with existing components
        const updatedLayout = currentLayout.map((item, index) => ({
          ...item,
          clientLayout: newLayout[index] || item.clientLayout, // Use new layout if available, fallback to current
        }))
        setCurrentLayout(updatedLayout)
      }
    },
    [isEditing, currentLayout],
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
        clientLayout: {
          h: widget?.minHeight ?? 1,
          i: widgetId,
          maxH: widget?.maxHeight ?? 3,
          maxW: widget?.maxWidth ?? 12,
          minH: widget?.minHeight ?? 1,
          minW: widget?.minWidth ?? 3,
          resizeHandles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
          w: widget?.minWidth ?? 3,
          x: 0, // Will be positioned automatically by react-grid-layout
          y: 0, // Will be positioned automatically by react-grid-layout
        },
        component: React.createElement(RenderWidget, {
          widgetId,
          // TODO: widgetData can be added here for custom props
        }),
      }

      // Add the new widget to the current layout
      setCurrentLayout([...currentLayout, newWidgetInstance])
    },
    [isEditing, currentLayout],
  )

  const deleteWidget = useCallback(
    (widgetId: string) => {
      if (!isEditing) {
        return
      }

      // Remove widget from current layout
      setCurrentLayout((prev) => prev.filter((item) => item.clientLayout.i !== widgetId))
    },
    [isEditing],
  )

  return {
    addWidget,
    cancel,
    currentLayout,
    deleteWidget,
    handleLayoutChange,
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
  }
}

function useSetLayoutPreference() {
  const { setPreference } = usePreferences()
  return useCallback(
    async (layout: Layout[] | null) => {
      await setPreference('dashboard-layout', { layouts: layout }, false)
    },
    [setPreference],
  )
}
