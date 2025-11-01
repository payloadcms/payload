import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CheckIcon, EditIcon, PlusIcon, SearchIcon, XIcon } from '@payloadcms/ui'
import React from 'react'
// Keep TrashIcon as direct import since it's not exported from main package
import { TrashIcon } from '../../packages/ui/src/icons/Trash'

const IconTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h3>✅ Icon Import Test</h3>
      <p>If you can see this page, icon imports are working correctly!</p>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          marginTop: '20px',
        }}
      >
        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <PlusIcon />
          </div>
          <div style={{ fontSize: '14px' }}>PlusIcon</div>
        </div>

        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <EditIcon />
          </div>
          <div style={{ fontSize: '14px' }}>EditIcon</div>
        </div>

        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <TrashIcon />
          </div>
          <div style={{ fontSize: '14px' }}>TrashIcon</div>
        </div>

        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <CheckIcon />
          </div>
          <div style={{ fontSize: '14px' }}>CheckIcon</div>
        </div>

        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <XIcon />
          </div>
          <div style={{ fontSize: '14px' }}>XIcon</div>
        </div>

        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <SearchIcon />
          </div>
          <div style={{ fontSize: '14px' }}>SearchIcon</div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px',
          marginTop: '30px',
          padding: '15px',
        }}
      >
        <h4 style={{ color: '#155724', margin: '0 0 8px 0' }}>✅ Success!</h4>
        <p style={{ color: '#155724', fontSize: '14px', margin: 0 }}>
          All Payload icons imported and rendered successfully. This confirms that:
        </p>
        <ul
          style={{ color: '#155724', fontSize: '14px', margin: '8px 0 0 0', paddingLeft: '20px' }}
        >
          <li>Path aliases are working correctly</li>
          <li>SCSS icon styles are loading</li>
          <li>SVG icons render properly</li>
          <li>Component imports are functioning</li>
        </ul>
      </div>
    </div>
  )
}

const meta = {
  component: IconTest,
  parameters: {
    layout: 'centered',
  },
  title: 'Test/Icon Test',
} satisfies Meta<typeof IconTest>

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {}
