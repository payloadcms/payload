'use client'

import React from 'react'

import type { TabMetadata } from './index.js'

import { SidebarItemsContent } from './SidebarItemsContent.js'
import { useSidebarItemsContext } from './SidebarItemsProvider.js'

export type SidebarTabsClientProps = {
  baseClass: string
  tabs: TabMetadata[]
}

export const SidebarTabsClient: React.FC<SidebarTabsClientProps> = ({ baseClass, tabs }) => {
  const { activeID, switchTo } = useSidebarItemsContext()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__tabs`}>
        {tabs.map((tab) => {
          const isActive = tab.slug === activeID

          return (
            <button
              className={`${baseClass}__tab ${isActive ? `${baseClass}__tab--active` : ''}`}
              key={tab.slug}
              onClick={() => switchTo(tab.slug)}
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
        <SidebarItemsContent />
      </div>
    </div>
  )
}
