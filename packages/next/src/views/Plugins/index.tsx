'use client'

import { PackageSearch } from 'lucide-react'
import React, { useState } from 'react'

import type { Package } from './components/usePackages.js'

import { PackageCard } from './components/PackageCard.js'
import { SearchBar } from './components/SearchBar.js'
import { TabSwitcher } from './components/TabSwitcher.js'
import { usePackages } from './components/usePackages.js'
import { ViewToggle } from './components/ViewToggle.js'
import './styles/main.scss'

type ViewMode = 'grid' | 'list'
type TabMode = 'all' | 'installed'

export const PluginsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<ViewMode>('list')
  const [activeTab, setActiveTab] = useState<TabMode>('all')

  const { loading, packages } = usePackages(searchTerm, activeTab)
  const installedCount = packages.filter((pkg) => pkg.isInstalled).length

  return (
    <>
      <div className="app">
        <div className="container">
          <header className="app__header">
            <div className="app__header-title">
              <PackageSearch className="app__header-title-icon" />
              <h1 className="app__header-title-text">PayloadCMS Plugins</h1>
            </div>
            <ViewToggle onViewChange={setView} view={view} />
          </header>

          <div className="app__controls">
            <SearchBar onChange={setSearchTerm} value={searchTerm} />
            <TabSwitcher
              activeTab={activeTab}
              installedCount={installedCount}
              onTabChange={setActiveTab}
            />
          </div>

          {loading ? (
            <div className="loading">
              {[1, 2, 3].map((i) => (
                <div className="loading__item" key={i} />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="empty-state">
              <PackageSearch className="empty-state__icon" />
              <h3 className="empty-state__title">No packages found</h3>
              <p className="empty-state__description">
                Try adjusting your search or filters to find what you're looking for
              </p>
            </div>
          ) : (
            <div className={`app__content app__content--${view}`}>
              {packages.map((pkg: Package) => (
                <PackageCard key={pkg.name} pkg={pkg} view={view} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
