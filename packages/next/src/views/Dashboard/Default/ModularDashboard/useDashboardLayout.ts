import type { WidgetWidth } from 'payload'

import { arrayMove } from '@dnd-kit/sortable'
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

  const moveWidget = useCallback(
    ({ moveFromIndex, moveToIndex }: { moveFromIndex: number; moveToIndex: number }) => {
      if (moveFromIndex === moveToIndex || moveFromIndex < 0 || moveToIndex < 0) {
        return
      }

      setCurrentLayout((prev) => {
        return arrayMove(prev, moveFromIndex, moveToIndex)
      })
    },
    [],
  )

  const addWidget = useCallback(
    (widgetSlug: string) => {
      if (!isEditing) {
        return
      }

      const widgetId = `${widgetSlug}-${Date.now()}`
      const widget = widgets.find((w) => w.slug === widgetSlug)

      // Create a new widget instance using RenderWidget
      const newWidgetInstance: WidgetInstanceClient = {
        component: React.createElement(RenderWidget, {
          widgetId,
          // TODO: widgetData can be added here for custom props
        }),
        item: {
          i: widgetId,
          maxW: widget?.maxWidth ?? 'full',
          minW: widget?.minWidth ?? 'x-small',
          w: widget?.minWidth ?? 'x-small',
        },
      }

      setCurrentLayout((prev) => [...prev, newWidgetInstance])
    },
    [isEditing, widgets],
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

  const resizeWidget = useCallback(
    (widgetId: string, newWidth: WidgetWidth) => {
      if (!isEditing) {
        return
      }
      setCurrentLayout((prev) =>
        prev.map((item) =>
          item.item.i === widgetId
            ? {
                ...item,
                item: {
                  ...item.item,
                  w: newWidth,
                },
              }
            : item,
        ),
      )
    },
    [isEditing],
  )

  return {
    addWidget,
    cancel,
    currentLayout,
    deleteWidget,
    isEditing,
    moveWidget,
    resetLayout,
    resizeWidget,
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
