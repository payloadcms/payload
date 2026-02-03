'use client'

import { Spinner, Tooltip, usePreferences, useServerFunctions } from '@payloadcms/ui'
import { PREFERENCE_KEYS } from 'payload'
import React, { useCallback, useRef, useState } from 'react'

import type { RenderTabServerFnArgs, RenderTabServerFnReturnType } from './renderTabServerFn.js'

import { TabError } from './TabError/index.js'

export type TabMetadata = {
  icon: React.ReactNode
  isDefaultActive?: boolean
  label: string
  slug: string
}

export type SidebarTabsClientProps = {
  baseClass: string
  initialActiveTabID: string
  initialTabContents: Record<string, React.ReactNode>
  /**
   * Minimum time (in ms) to show the loading overlay, prevents flashing on fast loads
   * @default 500
   */
  minLoadingTime?: number
  tabs: TabMetadata[]
}

export const SidebarTabsClient: React.FC<SidebarTabsClientProps> = ({
  baseClass,
  initialActiveTabID,
  initialTabContents,
  minLoadingTime = 500,
  tabs,
}) => {
  const { setPreference } = usePreferences()
  const { serverFunction } = useServerFunctions()

  const [activeTabID, setActiveTabID] = useState(initialActiveTabID)
  const [tabContent, setTabContent] = useState<Record<string, React.ReactNode>>(initialTabContents)
  const [loadingTab, setLoadingTab] = useState<null | string>(null)
  const [hoveredTab, setHoveredTab] = useState<null | string>(null)
  const loadingTabsRef = useRef<Set<string>>(new Set())
  const tabContentRef = useRef(initialTabContents)
  const loadingStartTimeRef = useRef<null | number>(null)

  const loadTabContent = useCallback(
    async (tabSlug: string) => {
      // Check if already loaded or currently loading
      if (tabContentRef.current[tabSlug] || loadingTabsRef.current.has(tabSlug)) {
        return
      }

      // Mark as loading and record start time
      loadingTabsRef.current.add(tabSlug)
      loadingStartTimeRef.current = Date.now()
      setLoadingTab(tabSlug)

      try {
        const result = (await serverFunction({
          name: 'render-tab',
          args: { tabSlug } as RenderTabServerFnArgs,
        })) as RenderTabServerFnReturnType

        const newContent = {
          ...tabContentRef.current,
          [tabSlug]: result.component,
        }

        tabContentRef.current = newContent
        setTabContent(newContent)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        const handleRetry = () => {
          // Clear the error and retry loading
          const clearedContent = { ...tabContentRef.current }
          delete clearedContent[tabSlug]
          tabContentRef.current = clearedContent
          setTabContent(clearedContent)
          void loadTabContent(tabSlug)
        }

        const newContent = {
          ...tabContentRef.current,
          [tabSlug]: <TabError message={errorMessage} onRetry={handleRetry} />,
        }

        tabContentRef.current = newContent
        setTabContent(newContent)
      } finally {
        // Ensure minimum loading time before hiding overlay
        const elapsedTime = Date.now() - (loadingStartTimeRef.current || 0)
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
        setTimeout(() => {
          loadingTabsRef.current.delete(tabSlug)
          setLoadingTab(null)
          loadingStartTimeRef.current = null
        }, remainingTime)
      }
    },
    [minLoadingTime, serverFunction],
  )

  const handleTabChange = (slug: string) => {
    setActiveTabID(slug)
    void setPreference(PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB, { activeTab: slug })
    void loadTabContent(slug)
  }

  const activeContent = tabContent[activeTabID]

  // If there's only one tab (the default nav), render it without tab UI
  if (tabs.length === 1) {
    return <>{activeContent}</>
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__tabs`}>
        {tabs.map((tab) => {
          const isActive = tab.slug === activeTabID

          return (
            <button
              className={`${baseClass}__tab ${isActive ? `${baseClass}__tab--active` : ''}`}
              key={tab.slug}
              onClick={() => handleTabChange(tab.slug)}
              onMouseEnter={() => setHoveredTab(tab.slug)}
              onMouseLeave={() => setHoveredTab(null)}
              type="button"
            >
              <Tooltip className={`${baseClass}__tooltip`} show={hoveredTab === tab.slug}>
                {tab.label}
              </Tooltip>
              <span className={`${baseClass}__tab-icon`}>{tab.icon}</span>
              <span className={`${baseClass}__tab-label`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className={`${baseClass}__content`}>
        {loadingTab === activeTabID ? <Spinner /> : activeContent}
      </div>
    </div>
  )
}
