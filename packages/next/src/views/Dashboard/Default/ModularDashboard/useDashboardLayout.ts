import type { WidgetWidth } from 'payload'

import { arrayMove } from '@dnd-kit/sortable'
import {
  ConfirmationModal,
  toast,
  useConfig,
  useModal,
  usePreferences,
  useServerFunctions,
} from '@payloadcms/ui'
import { PREFERENCE_KEYS } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { WidgetInstanceClient, WidgetItem } from './index.client.js'
import type { GetDefaultLayoutServerFnReturnType } from './renderWidget/getDefaultLayoutServerFn.js'

import { RenderWidget } from './renderWidget/RenderWidget.js'

export function useDashboardLayout(initialLayout: WidgetInstanceClient[]) {
  const setLayoutPreference = useSetLayoutPreference()
  const [isEditing, setIsEditing] = useState(false)
  const { widgets = [] } = useConfig().config.admin.dashboard ?? {}
  const [currentLayout, setCurrentLayout] = useState<WidgetInstanceClient[]>(initialLayout)
  const { openModal } = useModal()
  const cancelModalSlug = 'cancel-dashboard-changes'
  const { serverFunction } = useServerFunctions()

  // Sync state when initialLayout prop changes (e.g., when query params change and server component re-renders)
  useEffect(() => {
    if (!isEditing) {
      setCurrentLayout(initialLayout)
    }
    // do not sync while editing. Depending on `isEditing` in this effect causes an
    // unintended rollback when toggling from editing -> view mode after save.
  }, [initialLayout])

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

      const result = (await serverFunction({
        name: 'get-default-layout',
        args: {},
      })) as GetDefaultLayoutServerFnReturnType

      setCurrentLayout(result.layout)
      setIsEditing(false)
    } catch {
      toast.error('Failed to reset layout')
    }
  }, [setLayoutPreference, serverFunction])

  const performCancel = useCallback(() => {
    setCurrentLayout(initialLayout)
    setIsEditing(false)
  }, [initialLayout])

  const cancel = useCallback(() => {
    // Check if layout has changed
    const hasChanges =
      currentLayout.length !== initialLayout.length ||
      currentLayout.some((widget, index) => {
        const initialWidget = initialLayout[index]
        return (
          !initialWidget ||
          widget.item.id !== initialWidget.item.id ||
          widget.item.width !== initialWidget.item.width ||
          JSON.stringify(widget.item.data || {}) !== JSON.stringify(initialWidget.item.data || {})
        )
      })

    // If there are changes, show confirmation modal
    if (hasChanges) {
      openModal(cancelModalSlug)
    } else {
      performCancel()
    }
  }, [currentLayout, initialLayout, openModal, cancelModalSlug, performCancel])

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
      const widget = widgets.find((widget) => widget.slug === widgetSlug)

      // Create a new widget instance using RenderWidget
      const newWidgetInstance: WidgetInstanceClient = {
        component: React.createElement(RenderWidget, {
          widgetData: {},
          widgetId,
        }),
        item: {
          id: widgetId,
          data: {},
          maxWidth: widget?.maxWidth ?? 'full',
          minWidth: widget?.minWidth ?? 'x-small',
          width: widget?.minWidth ?? 'x-small',
        },
      }

      setCurrentLayout((prev) => [...prev, newWidgetInstance])

      // Scroll to the newly added widget after it's rendered and highlight it
      setTimeout(() => {
        const element = document.getElementById(widgetId)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })

          // Add highlight animation to the widget element
          const widget = element.closest('.widget')
          if (widget) {
            widget.classList.add('widget--highlight')
            // Remove the class after animation completes (1.5s fade out)
            setTimeout(() => {
              widget.classList.remove('widget--highlight')
            }, 1500)
          }
        }
      }, 100)
    },
    [isEditing, widgets],
  )

  const deleteWidget = useCallback(
    (widgetId: string) => {
      if (!isEditing) {
        return
      }
      setCurrentLayout((prev) => prev.filter((item) => item.item.id !== widgetId))
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
          item.item.id === widgetId
            ? {
                ...item,
                item: {
                  ...item.item,
                  width: newWidth,
                } satisfies WidgetItem,
              }
            : item,
        ),
      )
    },
    [isEditing],
  )

  const updateWidgetData = useCallback(
    (widgetId: string, data: Record<string, unknown>) => {
      if (!isEditing) {
        return
      }

      setCurrentLayout((prev) =>
        prev.map((item) =>
          item.item.id === widgetId
            ? {
                component: React.createElement(RenderWidget, {
                  widgetData: data,
                  widgetId,
                }),
                item: {
                  ...item.item,
                  data,
                } satisfies WidgetItem,
              }
            : item,
        ),
      )
    },
    [isEditing],
  )

  const cancelModal = React.createElement(ConfirmationModal, {
    body: 'You have unsaved changes to your dashboard layout. Are you sure you want to discard them?',
    confirmLabel: 'Discard',
    heading: 'Discard changes?',
    modalSlug: cancelModalSlug,
    onConfirm: performCancel,
  })

  return {
    addWidget,
    cancel,
    cancelModal,
    currentLayout,
    deleteWidget,
    isEditing,
    moveWidget,
    resetLayout,
    resizeWidget,
    saveLayout,
    setIsEditing,
    updateWidgetData,
  }
}

function useSetLayoutPreference() {
  const { setPreference } = usePreferences()
  return useCallback(
    async (layout: null | WidgetItem[]) => {
      await setPreference(PREFERENCE_KEYS.DASHBOARD_LAYOUT, { layouts: layout }, false)
    },
    [setPreference],
  )
}
