'use client'

import { DelayedSpinner, Tooltip, usePreferences, useServerFunctions } from '@payloadcms/ui'
import { PREFERENCE_KEYS } from 'payload/shared'
import React, { Activity, useCallback, useRef, useState } from 'react'

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
   * Delay before showing loading spinner (in ms), prevents flashing on fast loads
   * @default 200
   */
  loadingDelay?: number
  tabs: TabMetadata[]
}

export const SidebarTabsClient: React.FC<SidebarTabsClientProps> = ({
  baseClass,
  initialActiveTabID,
  initialTabContents,
  loadingDelay = 200,
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

  const loadTabContent = useCallback(
    async (tabSlug: string) => {
      // Check if already loaded or currently loading
      if (tabContentRef.current[tabSlug] || loadingTabsRef.current.has(tabSlug)) {
        return
      }

      // Mark as loading
      loadingTabsRef.current.add(tabSlug)
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
        loadingTabsRef.current.delete(tabSlug)
        setLoadingTab(null)
      }
    },
    [serverFunction],
  )

  const handleTabChange = useCallback(
    (slug: string) => {
      setActiveTabID(slug)
      void setPreference(PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB, { activeTab: slug })
      void loadTabContent(slug)
    },
    [setPreference, loadTabContent],
  )

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const direction = e.key === 'ArrowLeft' ? -1 : 1
        const newIndex = (currentIndex + direction + tabs.length) % tabs.length
        const newTab = tabs[newIndex]
        handleTabChange(newTab.slug)
        // Focus will be handled by the tabIndex change
        setTimeout(() => {
          document.querySelector<HTMLButtonElement>(`.${baseClass}__tab--active`)?.focus()
        }, 0)
      }
    },
    [baseClass, handleTabChange, tabs],
  )

  const activeContent = tabContent[activeTabID]

  // If there's only one tab (the default nav), render it without tab UI
  if (tabs.length === 1) {
    return <>{activeContent}</>
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__tabs`} role="tablist">
        {tabs.map((tab, index) => {
          const isActive = tab.slug === activeTabID

          return (
            <button
              aria-selected={isActive}
              className={`${baseClass}__tab ${isActive ? `${baseClass}__tab--active` : ''}`}
              key={tab.slug}
              onClick={() => handleTabChange(tab.slug)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              onMouseEnter={() => setHoveredTab(tab.slug)}
              onMouseLeave={() => setHoveredTab(null)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              <Tooltip
                className={`${baseClass}__tooltip`}
                position="top"
                show={hoveredTab === tab.slug}
              >
                {tab.label}
              </Tooltip>
              <span className={`${baseClass}__tab-icon`}>{tab.icon}</span>
              <span className={`${baseClass}__tab-label`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className={`${baseClass}__content`} role="tabpanel">
        <DelayedSpinner
          baseClass={baseClass}
          delay={loadingDelay}
          isLoading={loadingTab === activeTabID}
        />
        {tabs.map((tab) => {
          const content = tabContent[tab.slug]
          if (!content) {
            return null
          }
          const isActive = tab.slug === activeTabID && loadingTab !== activeTabID
          return (
            <Activity key={tab.slug} mode={isActive ? 'visible' : 'hidden'}>
              {content}
            </Activity>
          )
        })}
      </div>
    </div>
  )
}
