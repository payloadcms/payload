import type { WidgetWidth } from 'payload'

import { arrayMove } from '@dnd-kit/sortable'
import { dequal } from 'dequal/lite'
import { getWidgetControlData, PREFERENCE_KEYS } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'

import type { WidgetInstanceClient, WidgetItem } from './index.client.js'
import type { GetDefaultLayoutServerFnReturnType } from './renderWidget/getDefaultLayoutServerFn.js'
import type { WidgetDropSizing } from './utils/getValidSideDropTargets.js'

import { ConfirmationModal } from '../../../../elements/ConfirmationModal/index.js'
import { useModal } from '../../../../elements/Modal/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useEmbed } from '../../../../providers/Embed/index.js'
import { usePreferences } from '../../../../providers/Preferences/index.js'
import { useServerFunctions } from '../../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { RenderWidget } from './renderWidget/RenderWidget.js'
import { resizeWidgetLayout } from './utils/resizeWidgetLayout.js'
import {
  getLayoutRows,
  placeWidgetInLayout,
  removeWidgetFromLayout,
} from './utils/widgetLayoutRows.js'

const WIDGET_WIDTHS: WidgetWidth[] = ['x-small', 'small', 'medium', 'large', 'x-large', 'full']

export function useDashboardLayout(initialLayout: WidgetInstanceClient[]) {
  const setLayoutPreference = useSetLayoutPreference()
  const { isEmbedded } = useEmbed()
  const [isEditingState, setIsEditingState] = useState(false)
  const isEditing = !isEmbedded && isEditingState
  const setIsEditing = useCallback(
    (shouldEdit: boolean) => setIsEditingState(shouldEdit && !isEmbedded),
    [isEmbedded],
  )
  const { widgets = [] } = useConfig().config.admin.dashboard ?? {}
  const [currentLayout, setCurrentLayout] = useState<WidgetInstanceClient[]>(initialLayout)
  const savedLayoutRef = useRef(initialLayout)
  const resizeSessionRef = useRef<{ layout: WidgetInstanceClient[]; widgetID: string } | null>(null)
  const { openModal } = useModal()
  const cancelModalSlug = 'cancel-dashboard-changes'
  const { serverFunction } = useServerFunctions()
  const { t } = useTranslation()

  useEffect(() => {
    if (isEmbedded) {
      savedLayoutRef.current = initialLayout
      setIsEditingState(false)
      setCurrentLayout(initialLayout)
    }
  }, [isEmbedded, initialLayout])

  // Sync state when initialLayout prop changes (e.g., when query params change and server component re-renders)
  useEffect(() => {
    if (!isEditing) {
      savedLayoutRef.current = initialLayout
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
      savedLayoutRef.current = currentLayout
    } catch {
      setIsEditing(true)
      toast.error(t('error:failedToSaveLayout'))
    }
  }, [setLayoutPreference, currentLayout, setIsEditing])

  const resetLayout = useCallback(async () => {
    try {
      await setLayoutPreference(null)

      const result = (await serverFunction({
        name: 'get-default-layout',
        args: {},
      })) as GetDefaultLayoutServerFnReturnType

      setCurrentLayout(result.layout)
      savedLayoutRef.current = result.layout
      setIsEditing(false)
    } catch {
      toast.error(t('error:failedToResetLayout'))
    }
  }, [setLayoutPreference, serverFunction, setIsEditing])

  const performCancel = useCallback(() => {
    setCurrentLayout(savedLayoutRef.current)
    setIsEditing(false)
  }, [setIsEditing])

  const cancel = useCallback(() => {
    const hasChanges = !dequal(
      getComparableLayout({ layout: currentLayout }),
      getComparableLayout({ layout: savedLayoutRef.current }),
    )

    // If there are changes, show confirmation modal
    if (hasChanges) {
      openModal(cancelModalSlug)
    } else {
      performCancel()
    }
  }, [currentLayout, openModal, cancelModalSlug, performCancel])

  const moveWidget = useCallback(
    ({
      moveFromIndex,
      moveToIndex,
      overID,
      resizeTarget,
      width,
    }: {
      moveFromIndex: number
      moveToIndex: number
      overID?: string
      width?: WidgetWidth
    } & Pick<WidgetDropSizing, 'resizeTarget'>) => {
      if (
        (moveFromIndex === moveToIndex && !width && !resizeTarget && !overID) ||
        moveFromIndex < 0 ||
        moveToIndex < 0
      ) {
        return
      }

      setCurrentLayout((prev) => {
        if (moveFromIndex >= prev.length || moveToIndex >= prev.length) {
          return prev
        }
        if (overID) {
          const widget = prev[moveFromIndex]
          return placeWidgetInLayout({
            layout: prev,
            overID,
            resizeTarget,
            widget: width ? { ...widget, item: { ...widget.item, width } } : widget,
          })
        }
        const moved = arrayMove(prev, moveFromIndex, moveToIndex)

        return moved.map((widget, index) => {
          const newWidth =
            index === moveToIndex
              ? width
              : resizeTarget?.widgetID === widget.item.id
                ? resizeTarget.width
                : undefined

          return newWidth ? { ...widget, item: { ...widget.item, width: newWidth } } : widget
        })
      })
    },
    [],
  )

  const addWidget = useCallback(
    ({
      index,
      overID,
      resizeTarget,
      widgetSlug,
      width,
    }: { index?: number; overID?: string; widgetSlug: string; width?: WidgetWidth } & Pick<
      WidgetDropSizing,
      'resizeTarget'
    >) => {
      if (!isEditing) {
        return
      }

      const widgetId = `${widgetSlug}-${uuid().replaceAll('-', '')}`
      const widget = widgets.find((widget) => widget.slug === widgetSlug)

      if (!widget) {
        return
      }
      const data = getWidgetControlData({ controls: widget.controls })
      const minWidth = widget.minWidth ?? 'x-small'
      const maxWidth = widget.maxWidth ?? 'full'
      const widthIndex = Math.max(
        WIDGET_WIDTHS.indexOf(minWidth),
        Math.min(WIDGET_WIDTHS.indexOf(maxWidth), WIDGET_WIDTHS.indexOf(width ?? minWidth)),
      )

      // Create a new widget instance using RenderWidget
      const newWidgetInstance: WidgetInstanceClient = {
        component: React.createElement(RenderWidget, {
          widgetData: data,
          widgetId,
        }),
        item: {
          id: widgetId,
          data,
          maxWidth,
          minWidth,
          width: WIDGET_WIDTHS[widthIndex],
        },
      }

      setCurrentLayout((prev) => {
        const next = prev.map((widget) =>
          widget.item.id === resizeTarget?.widgetID
            ? { ...widget, item: { ...widget.item, width: resizeTarget.width } }
            : widget,
        )

        if (overID) {
          return placeWidgetInLayout({
            layout: prev,
            overID,
            resizeTarget,
            widget: newWidgetInstance,
          })
        }
        next.splice(Math.max(0, Math.min(index ?? prev.length, prev.length)), 0, newWidgetInstance)
        return next
      })

      // Scroll to the newly added widget after it's rendered and highlight it
      setTimeout(() => {
        const element = document.getElementById(widgetId)
        if (element) {
          element.focus({ preventScroll: true })
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

  const replaceWidget = useCallback(
    ({ widgetID, widgetSlug }: { widgetID: string; widgetSlug: string }) => {
      const currentWidget = currentLayout.find(({ item }) => item.id === widgetID)
      const widget = widgets.find(({ slug }) => slug === widgetSlug)

      if (!isEditing || !currentWidget || !widget) {
        return
      }

      const newWidgetID = `${widgetSlug}-${uuid().replaceAll('-', '')}`
      const minWidth = widget.minWidth ?? 'x-small'
      const maxWidth = widget.maxWidth ?? 'full'
      const widthIndex = Math.max(
        WIDGET_WIDTHS.indexOf(minWidth),
        Math.min(WIDGET_WIDTHS.indexOf(currentWidget.item.width), WIDGET_WIDTHS.indexOf(maxWidth)),
      )
      const data = getWidgetControlData({ controls: widget.controls })
      const replacement: WidgetInstanceClient = {
        component: React.createElement(RenderWidget, {
          widgetData: data,
          widgetId: newWidgetID,
        }),
        item: {
          id: newWidgetID,
          data,
          maxWidth,
          minWidth,
          width: WIDGET_WIDTHS[widthIndex],
          ...(currentWidget.item.startsNewRow ? { startsNewRow: true } : {}),
        },
      }

      setCurrentLayout((prev) =>
        prev.map((item) => (item.item.id === widgetID ? replacement : item)),
      )
      setTimeout(() => {
        document.getElementById(newWidgetID)?.focus({ preventScroll: true })
      }, 100)

      return newWidgetID
    },
    [currentLayout, isEditing, widgets],
  )

  const deleteWidget = useCallback(
    (widgetId: string) => {
      if (!isEditing) {
        return
      }
      setCurrentLayout((prev) => removeWidgetFromLayout({ layout: prev, widgetID: widgetId }))
    },
    [isEditing],
  )

  const startWidgetResize = useCallback(
    (widgetID: string) => {
      if (isEditing) {
        resizeSessionRef.current = { layout: currentLayout, widgetID }
      }
    },
    [currentLayout, isEditing],
  )

  const finishWidgetResize = useCallback(({ shouldCancel }: { shouldCancel: boolean }) => {
    const session = resizeSessionRef.current

    resizeSessionRef.current = null
    if (shouldCancel && session) {
      setCurrentLayout(session.layout)
    }
  }, [])

  const resizeWidget = useCallback(
    ({
      edge,
      widgetID,
      width,
    }: {
      edge?: 'end' | 'start'
      widgetID: string
      width: WidgetWidth
    }) => {
      if (!isEditing) {
        return
      }
      const session = resizeSessionRef.current

      setCurrentLayout((prev) => {
        return resizeWidgetLayout({
          edge,
          layout: session?.widgetID === widgetID ? session.layout : prev,
          widgetID,
          width,
        })
      })
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
    body: t('dashboard:discardMessage'),
    confirmLabel: t('dashboard:discardConfirmLabel'),
    heading: t('dashboard:discardTitle'),
    modalSlug: cancelModalSlug,
    onConfirm: performCancel,
  })

  return {
    addWidget,
    cancel,
    cancelModal,
    currentLayout,
    deleteWidget,
    finishWidgetResize,
    isEditing,
    moveWidget,
    replaceWidget,
    resetLayout,
    resizeWidget,
    saveLayout,
    setIsEditing,
    startWidgetResize,
    updateWidgetData,
  }
}

function getComparableLayout({ layout }: { layout: WidgetInstanceClient[] }) {
  return getLayoutRows({ getItem: ({ item }) => item, layout }).map((row) =>
    row.map(({ item }) => ({ id: item.id, data: item.data ?? {}, width: item.width })),
  )
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
