'use client'

import type { Layout } from 'react-grid-layout'

import { usePreferences } from '@payloadcms/ui'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { useCallback, useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import type { RenderedWidget } from './index.js'

import { DashboardBreadcrumbDropdown } from './DashboardBreadcrumbDropdown.js'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINT = 768

type DashboardLayoutPreferences = {
  layouts?: Layout[]
}

export function ModularDashboardClient({ widgets }: { widgets: RenderedWidget[] }) {
  const { getPreference, setPreference } = usePreferences()
  const [isEditing, setIsEditing] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<Layout[]>([])
  const [savedLayout, setSavedLayout] = useState<Layout[]>([])

  const DASHBOARD_PREFERENCES_KEY = 'dashboard-layout'

  // Generate default layout based on widgets
  const generateDefaultLayout = useCallback(() => {
    return widgets.map((widget, index) => {
      const colsPerRow = 12
      let x = 0

      // Simple layout algorithm: place widgets left to right, then wrap to next row
      let currentX = 0

      for (let i = 0; i < index; i++) {
        const prevWidget = widgets[i]
        currentX += prevWidget.width

        // If we exceed the row width, wrap to next row
        if (currentX > colsPerRow) {
          currentX = prevWidget.width
        }
      }

      x = currentX

      return {
        h: widget.height || 1,
        i: `${widget.widgetSlug}-${index}`,
        maxH: 3,
        maxW: 12,
        minH: 1,
        minW: 3,
        w: widget.width || 3,
        x,
        y: 0,
      }
    })
  }, [widgets])

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleResetLayout = useCallback(async () => {
    try {
      // Delete the saved preferences to reset to default
      await setPreference(DASHBOARD_PREFERENCES_KEY, null, false)

      // Reset to default layout
      const defaultLayout = generateDefaultLayout()
      setCurrentLayout(defaultLayout)
      setSavedLayout([])
      setIsEditing(false)
    } catch {
      // Handle error silently or show user feedback
    }
  }, [setPreference, DASHBOARD_PREFERENCES_KEY, generateDefaultLayout])

  const handleSaveChanges = useCallback(async () => {
    try {
      // Save current layout to preferences
      await setPreference(DASHBOARD_PREFERENCES_KEY, { layouts: currentLayout }, false)
      setSavedLayout([...currentLayout])
      setIsEditing(false)
    } catch {
      // Handle error silently or show user feedback
    }
  }, [setPreference, DASHBOARD_PREFERENCES_KEY, currentLayout])

  const handleCancel = useCallback(() => {
    // Restore the saved layout
    if (savedLayout.length > 0) {
      setCurrentLayout([...savedLayout])
    } else {
      // If no saved layout, restore to default
      const defaultLayout = generateDefaultLayout()
      setCurrentLayout(defaultLayout)
    }
    setIsEditing(false)
  }, [savedLayout, generateDefaultLayout])

  const handleAddWidget = () => {
    // TODO: Open add widget modal
  }

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences: DashboardLayoutPreferences =
          await getPreference(DASHBOARD_PREFERENCES_KEY)

        if (preferences?.layouts) {
          setCurrentLayout(preferences.layouts)
          setSavedLayout(preferences.layouts)
        } else {
          // No saved preferences, use default layout
          const defaultLayout = generateDefaultLayout()
          setCurrentLayout(defaultLayout)
        }
      } catch {
        // Fallback to default layout
        const defaultLayout = generateDefaultLayout()
        setCurrentLayout(defaultLayout)
      }
    }

    void loadPreferences()
  }, [getPreference, DASHBOARD_PREFERENCES_KEY, generateDefaultLayout])

  // Handle layout changes during editing
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (isEditing) {
        setCurrentLayout(newLayout)
      }
    },
    [isEditing],
  )

  // Use current layout or generate default layout
  const layout = currentLayout.length > 0 ? currentLayout : generateDefaultLayout()

  return (
    <div>
      <SetStepNav
        nav={[
          {
            label: (
              <DashboardBreadcrumbDropdown
                isEditing={isEditing}
                onAddWidget={handleAddWidget}
                onCancel={handleCancel}
                onEditClick={handleEditClick}
                onResetLayout={handleResetLayout}
                onSaveChanges={handleSaveChanges}
              />
            ),
          },
        ]}
      />

      <ResponsiveGridLayout
        breakpoints={{ lg: BREAKPOINT, xxs: 0 }}
        className={`grid-layout ${isEditing ? 'editing' : ''}`}
        cols={{ lg: 12, xxs: 6 }}
        isDraggable={isEditing}
        isResizable={isEditing}
        layouts={{ lg: layout }}
        onLayoutChange={handleLayoutChange}
        // preventCollision // not sure if this gives a better UX
        rowHeight={(BREAKPOINT / 12) * 3}
      >
        {widgets.map((widget, index) => (
          <div className="widget" key={`${widget.widgetSlug}-${index}`}>
            <div className="widget-content">{widget.component}</div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}
