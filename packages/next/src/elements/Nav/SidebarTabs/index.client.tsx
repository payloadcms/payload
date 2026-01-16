'use client'

import type { NavPreferences } from 'payload'

import { usePreferences } from '@payloadcms/ui'
import React, { useState } from 'react'

export type RenderedTab = {
  content: React.ReactNode
  icon: React.ReactNode
  isDefaultActive?: boolean
  label: string
  slug: string
}

export type SidebarTabsClientProps = {
  baseClass: string
  navPreferences: NavPreferences
  renderedTabs: RenderedTab[]
}

export const SidebarTabsClient: React.FC<SidebarTabsClientProps> = ({
  baseClass,
  navPreferences,
  renderedTabs,
}) => {
  const { setPreference } = usePreferences()

  // Use preference if available, otherwise find default active tab
  const defaultTab =
    navPreferences.activeTab ||
    renderedTabs.find((tab) => tab.isDefaultActive)?.slug ||
    renderedTabs[0]?.slug

  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (slug: string) => {
    setActiveTab(slug)
    void setPreference('sidebar', { activeTab: slug })
  }

  const activeTabData = renderedTabs.find((tab) => tab.slug === activeTab)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__tabs`}>
        {renderedTabs.map((tab) => {
          const isActive = tab.slug === activeTab

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
      <div className={`${baseClass}__content`}>{activeTabData?.content}</div>
    </div>
  )
}
