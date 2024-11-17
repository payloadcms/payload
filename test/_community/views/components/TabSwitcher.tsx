import React from 'react'

import type { TabMode } from '../types'

interface TabSwitcherProps {
  activeTab: TabMode
  installedCount: number
  onTabChange: (tab: TabMode) => void
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  installedCount,
  onTabChange,
}) => {
  return (
    <div className="tab-switcher">
      <button
        className={`tab-switcher__tab ${activeTab === 'all' ? 'tab-switcher__tab--active' : ''}`}
        onClick={() => onTabChange('all')}
      >
        All
      </button>
      <button
        className={`tab-switcher__tab ${
          activeTab === 'installed' ? 'tab-switcher__tab--active' : ''
        }`}
        onClick={() => onTabChange('installed')}
      >
        Installed
        <span className="tab-switcher__count">{installedCount}</span>
      </button>
    </div>
  )
}
