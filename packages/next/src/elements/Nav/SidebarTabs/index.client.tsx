'use client'

import { usePreferences, useServerFunctions } from '@payloadcms/ui'
import { PREFERENCE_KEYS } from 'payload'
import React, { useCallback, useState } from 'react'

import type { RenderTabServerFnArgs, RenderTabServerFnReturnType } from './renderTabServerFn.js'

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
  tabs: TabMetadata[]
}

export const SidebarTabsClient: React.FC<SidebarTabsClientProps> = ({
  baseClass,
  initialActiveTabID,
  initialTabContents,
  tabs,
}) => {
  const { setPreference } = usePreferences()
  const { serverFunction } = useServerFunctions()

  const [activeTabID, setActiveTabID] = useState(initialActiveTabID)
  const [tabContent, setTabContent] = useState<Record<string, React.ReactNode>>(initialTabContents)
  const [loadingTab, setLoadingTab] = useState<null | string>(null)

  const loadTabContent = useCallback(
    async (tabSlug: string) => {
      if (tabContent[tabSlug]) {
        return
      }

      setLoadingTab(tabSlug)

      try {
        const result = (await serverFunction({
          name: 'render-tab',
          args: { tabSlug } as RenderTabServerFnArgs,
        })) as RenderTabServerFnReturnType

        setTabContent((prev) => ({
          ...prev,
          [tabSlug]: result.component,
        }))
      } catch (_) {
        setTabContent((prev) => ({
          ...prev,
          [tabSlug]: null,
        }))
      } finally {
        setLoadingTab(null)
      }
    },
    [serverFunction, tabContent],
  )

  const handleTabChange = (slug: string) => {
    setActiveTabID(slug)
    void setPreference(PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB, { activeTab: slug })
    void loadTabContent(slug)
  }

  const activeContent = tabContent[activeTabID]

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
              title={tab.label}
              type="button"
            >
              <span className={`${baseClass}__tab-icon`}>{tab.icon}</span>
              <span className={`${baseClass}__tab-label`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className={`${baseClass}__content`}>
        {loadingTab === activeTabID ? null : activeContent}
      </div>
    </div>
  )
}
