'use client'

import { Gutter, SetStepNav } from '@payloadcms/ui'
import React, { useState } from 'react'

import { IconsView } from '../Icons/index.js'
import './index.css'

type Tab = 'dashboard' | 'icons'

export const CustomDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <Gutter className="custom-dashboard">
      <SetStepNav nav={[]} />

      <div className="custom-dashboard__tabs">
        <button
          className={`custom-dashboard__tab ${activeTab === 'dashboard' ? 'custom-dashboard__tab--active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          type="button"
        >
          Dashboard
        </button>
        <button
          className={`custom-dashboard__tab ${activeTab === 'icons' ? 'custom-dashboard__tab--active' : ''}`}
          onClick={() => setActiveTab('icons')}
          type="button"
        >
          Icons
        </button>
      </div>

      <div className="custom-dashboard__content">
        {activeTab === 'dashboard' && (
          <div className="custom-dashboard__welcome">
            <h1>Dashboard</h1>
            <p>Welcome to the v4 test suite. Use the tabs above to navigate.</p>
          </div>
        )}
        {activeTab === 'icons' && <IconsView />}
      </div>
    </Gutter>
  )
}

export default CustomDashboard
