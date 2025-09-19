/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ClientCollectionConfig, ClientConfig, ViewTypes } from 'payload'

import React, { useState } from 'react'

import { DefaultListViewTabs } from './index.js'

const meta: Meta<typeof DefaultListViewTabs> = {
  component: DefaultListViewTabs,
  parameters: {
    docs: {
      description: {
        component:
          'Tab navigation component for collection list views with support for trash and folders.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/DefaultListViewTabs',
}

export default meta

type Story = StoryObj<typeof meta>

const containerStyles: React.CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  gap: '30px',
  justifyContent: 'center',
  margin: '0 auto',
  maxWidth: '900px',
  minHeight: '100vh',
  padding: '40px 20px',
  width: '100%',
}

const listHeaderStyles: React.CSSProperties = {
  backgroundColor: 'var(--theme-elevation-0)',
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: '4px',
  padding: '20px',
  width: '100%',
}

const mockConfig = {
  admin: {
    routes: {
      admin: '/admin',
    },
  },
  collections: [],
  folders: {
    slug: 'folders',
  },
  serverURL: 'http://localhost:3000',
} as unknown as ClientConfig

const mockCollectionWithTrashAndFolders = {
  slug: 'posts',
  folders: true,
  labels: {
    plural: 'Posts',
    singular: 'Post',
  },
  trash: true,
} as unknown as ClientCollectionConfig

const mockCollectionTrashOnly = {
  slug: 'users',
  folders: false,
  labels: {
    plural: 'Users',
    singular: 'User',
  },
  trash: true,
} as unknown as ClientCollectionConfig

const mockCollectionFoldersOnly = {
  slug: 'categories',
  folders: true,
  labels: {
    plural: 'Categories',
    singular: 'Category',
  },
  trash: false,
} as unknown as ClientCollectionConfig

const ListHeaderDemo: React.FC<{
  collectionConfig: ClientCollectionConfig
  description: string
  title: string
}> = ({ collectionConfig, description, title }) => {
  const [currentView, setCurrentView] = useState<ViewTypes>('list')
  const [navigationLog, setNavigationLog] = useState<string[]>([])
  const [preferences, setPreferences] = useState<Record<string, unknown>>({})

  const handleViewChange = (newViewType: ViewTypes) => {
    setCurrentView(newViewType)

    // Simulate URL generation like the real component
    let path = `/collections/${collectionConfig.slug}`
    switch (newViewType) {
      case 'folders':
        path = `/collections/${collectionConfig.slug}/folders`
        break
      case 'trash':
        path = `/collections/${collectionConfig.slug}/trash`
        break
    }

    const fullUrl = `http://localhost:3000/admin${path}`

    // Log the navigation
    setNavigationLog((prev) => [...prev.slice(-2), `Navigated to: ${fullUrl}`])

    // Simulate preference saving
    if (newViewType === 'list' || newViewType === 'folders') {
      setPreferences((prev) => ({
        ...prev,
        [`collection-${collectionConfig.slug}`]: {
          listViewType: newViewType,
        },
      }))
    }
  }

  return (
    <div style={listHeaderStyles}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>{title}</h3>
        <p
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '14px',
            margin: '0 0 15px 0',
          }}
        >
          {description}
        </p>
      </div>

      {/* Simulate ListHeader Actions array like in real usage */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--base)',
          marginBottom: '20px',
        }}
      >
        <DefaultListViewTabs
          collectionConfig={collectionConfig}
          config={mockConfig}
          onChange={handleViewChange}
          viewType={currentView}
        />
      </div>

      {/* Show what happens when tabs are clicked */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-600)',
            flex: '1',
            fontSize: '12px',
            minWidth: '200px',
            padding: '15px',
          }}
        >
          <strong>Current View:</strong> {currentView}
          <br />
          <strong>Active Tab:</strong>{' '}
          {currentView === 'list'
            ? `All ${typeof collectionConfig.labels?.plural === 'string' ? collectionConfig.labels.plural : 'Items'}`
            : currentView === 'folders'
              ? 'By Folder'
              : currentView === 'trash'
                ? 'Trash'
                : currentView}
        </div>

        <div
          style={{
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-600)',
            flex: '1',
            fontSize: '12px',
            minWidth: '200px',
            padding: '15px',
          }}
        >
          <strong>Navigation Log:</strong>
          <br />
          {navigationLog.length > 0 ? (
            navigationLog.map((log, index) => (
              <div key={index} style={{ fontFamily: 'monospace', marginTop: '5px' }}>
                {log}
              </div>
            ))
          ) : (
            <em>Click tabs to see navigation</em>
          )}
        </div>
      </div>

      {/* Show saved preferences */}
      {Object.keys(preferences).length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-600)',
            fontSize: '12px',
            marginTop: '10px',
            padding: '15px',
          }}
        >
          <strong>Saved Preferences:</strong>
          <pre style={{ fontSize: '11px', margin: '5px 0 0 0' }}>
            {JSON.stringify(preferences, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'DefaultListViewTabs as used in CollectionListHeader with both trash and folders enabled.',
      },
    },
  },
  render: () => (
    <div style={containerStyles}>
      <ListHeaderDemo
        collectionConfig={mockCollectionWithTrashAndFolders}
        description="As used in CollectionListHeader Actions array - shows All Posts, By Folder, and Trash tabs"
        title="Posts Collection (Trash + Folders)"
      />
    </div>
  ),
}
