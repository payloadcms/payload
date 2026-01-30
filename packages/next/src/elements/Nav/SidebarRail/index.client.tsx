'use client'

import { Hamburger, NavToggler, useNav } from '@payloadcms/ui'
import React from 'react'

import type { TabMetadata } from '../SidebarTabs/index.js'

import { useSidebarItemsContext } from '../SidebarTabs/SidebarItemsProvider.js'

export type SidebarRailClientProps = {
  baseClass: string
  tabs: TabMetadata[]
}

export const SidebarRailClient: React.FC<SidebarRailClientProps> = ({ baseClass, tabs }) => {
  const { activeID, switchTo } = useSidebarItemsContext()
  const { navOpen } = useNav()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__toggle`}>
        <NavToggler>
          <Hamburger closeIcon="collapse" isActive={navOpen} />
        </NavToggler>
      </div>
      <div className={`${baseClass}__items`}>
        {tabs.map((tab) => {
          const isActive = tab.slug === activeID

          return (
            <button
              className={`${baseClass}__item ${isActive ? `${baseClass}__item--active` : ''}`}
              key={tab.slug}
              onClick={() => switchTo(tab.slug)}
              title={tab.label}
              type="button"
            >
              <span className={`${baseClass}__item-icon`}>{tab.icon}</span>
              <span className={`${baseClass}__item-label`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
