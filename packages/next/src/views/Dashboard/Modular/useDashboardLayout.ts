import type { Widget } from 'payload'
import type { Layout } from 'react-grid-layout'

import { usePreferences } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

import type { WidgetInstanceClient } from './client.js'

export function useDashboardLayout(initialLayout: WidgetInstanceClient[], widgets: Widget[]) {
  const { setPreference } = usePreferences()
  const [isEditing, setIsEditing] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<WidgetInstanceClient[]>(initialLayout)

  const DASHBOARD_PREFERENCES_KEY = 'dashboard-layout'

  const saveLayout = useCallback(async () => {
    try {
      // Convert LayoutItem to react-grid-layout Layout format
      const layoutData: Layout[] = currentLayout.map((item) => item.clientLayout)

      await setPreference(DASHBOARD_PREFERENCES_KEY, { layouts: layoutData }, false)
      setIsEditing(false)
      // Reload to get fresh layout from server
      window.location.reload()
    } catch {
      // Handle error silently or show user feedback
    }
  }, [setPreference, currentLayout])

  const resetLayout = useCallback(async () => {
    try {
      await setPreference(DASHBOARD_PREFERENCES_KEY, null, false)
      setIsEditing(false)
      // Reload to get default layout from server
      window.location.reload()
    } catch {
      // Handle error silently or show user feedback
    }
  }, [setPreference])

  const cancel = useCallback(() => {
    // Restore initial layout
    setCurrentLayout(initialLayout)
    setIsEditing(false)
  }, [initialLayout])

  return {
    cancel,
    currentLayout,
    isEditing,
    resetLayout,
    saveLayout,
    setCurrentLayout,
    setIsEditing,
  }
}
