import type { Layout } from 'react-grid-layout'

import { usePreferences } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

type DashboardLayoutPreferences = {
  layouts?: Layout[]
}

export function useDashboardLayout() {
  const { getPreference, setPreference } = usePreferences()
  const [isEditing, setIsEditing] = useState(false)

  const DASHBOARD_PREFERENCES_KEY = 'dashboard-layout'

  const saveLayout = useCallback(
    async (layout: Layout[]) => {
      try {
        await setPreference(DASHBOARD_PREFERENCES_KEY, { layouts: layout }, false)
      } catch {
        // Handle error silently or show user feedback
      }
    },
    [setPreference, DASHBOARD_PREFERENCES_KEY],
  )

  const resetLayout = useCallback(async () => {
    try {
      await setPreference(DASHBOARD_PREFERENCES_KEY, null, false)
    } catch {
      // Handle error silently or show user feedback
    }
  }, [setPreference, DASHBOARD_PREFERENCES_KEY])

  const getSavedLayout = useCallback(async (): Promise<Layout[]> => {
    try {
      const preferences: DashboardLayoutPreferences = await getPreference(DASHBOARD_PREFERENCES_KEY)
      return preferences?.layouts || []
    } catch {
      return []
    }
  }, [getPreference, DASHBOARD_PREFERENCES_KEY])

  return {
    getSavedLayout,
    isEditing,
    resetLayout,
    saveLayout,
    setIsEditing,
  }
}
