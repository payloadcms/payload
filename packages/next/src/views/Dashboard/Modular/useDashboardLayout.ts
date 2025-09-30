import type { Widget } from 'payload'
import type { Layout } from 'react-grid-layout'

import { usePreferences } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import type { WidgetInstanceClient } from './client.js'

import { RenderWidget } from './RenderWidget.js'

export function useDashboardLayout(initialLayout: WidgetInstanceClient[], _widgets: Widget[]) {
  const setLayoutPreference = useSetLayoutPreference()
  const [isEditing, setIsEditing] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<WidgetInstanceClient[]>(initialLayout)

  const saveLayout = useCallback(async () => {
    try {
      // Convert LayoutItem to react-grid-layout Layout format
      const layoutData: Layout[] = currentLayout.map((item) => item.clientLayout)
      await setLayoutPreference(layoutData)
      setIsEditing(false)
      // Reload to get fresh layout from server
      window.location.reload()
    } catch {
      // Handle error silently or show user feedback
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

      // Create a new widget instance using RenderWidget (Lexical pattern)
      const newWidgetInstance: WidgetInstanceClient = {
        clientLayout: {
          h: 1, // Default height
          i: widgetId,
          maxH: 3,
          maxW: 12,
          minH: 1,
          minW: 3,
          w: 3, // Default width
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

  return {
    addWidget,
    cancel,
    currentLayout,
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
    async (layout: Layout[]) => {
      await setPreference('dashboard-layout', { layouts: layout }, false)
    },
    [setPreference],
  )
}
