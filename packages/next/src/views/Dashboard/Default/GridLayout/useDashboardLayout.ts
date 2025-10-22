import { toast, useConfig, usePreferences } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import type { Layout, WidgetInstanceClient, WidgetItem } from './client.js'

import { RenderWidget } from './renderWidget/RenderWidget.js'

export function useDashboardLayout(initialLayout: WidgetInstanceClient[]) {
  const setLayoutPreference = useSetLayoutPreference()
  const [isEditing, setIsEditing] = useState(false)
  const { widgets = [] } = useConfig().config.admin.dashboard ?? {}
  const [currentLayout, setCurrentLayout] = useState<Layout>(() => {
    const layout: Layout = [[]]
    const columns = 12
    let currentX = 0
    initialLayout.forEach((item) => {
      currentX += item.item.w
      if (currentX > columns) {
        currentX = 0
        layout.push([item])
      } else {
        layout.at(-1).push(item)
      }
    })
    return layout
  })

  const saveLayout = useCallback(async () => {
    try {
      const layoutData: WidgetItem[] = currentLayout.flatMap((item) =>
        item.map((item) => item.item),
      )
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
  const handleLayoutChange = useCallback(() => {
    // TODO
  }, [isEditing, currentLayout])

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

      const spaceLastRow = currentLayout.at(-1).reduce((acc, item) => acc + item.item.w, 0)
      if (spaceLastRow + (widget?.minWidth ?? 3) > 12) {
        setCurrentLayout((prev) => [...prev, [newWidgetInstance]])
      } else {
        setCurrentLayout((prev) => {
          prev.at(-1).push(newWidgetInstance)
          return prev
        })
      }
    },
    [isEditing, currentLayout],
  )

  const deleteWidget = useCallback(
    (widgetId: string) => {
      if (!isEditing) {
        return
      }
      const rowIndex = currentLayout.findIndex((row) =>
        row.some((item) => item.item.i === widgetId),
      )
      if (rowIndex === -1) {
        return
      }
      const itemIndex = currentLayout.at(rowIndex).findIndex((item) => item.item.i === widgetId)
      if (itemIndex === -1) {
        return
      }
      setCurrentLayout((prev) => {
        prev.at(rowIndex).splice(itemIndex, 1)
        return prev
      })
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
    async (layout: null | WidgetItem[]) => {
      await setPreference('dashboard-layout', { layouts: layout }, false)
    },
    [setPreference],
  )
}
