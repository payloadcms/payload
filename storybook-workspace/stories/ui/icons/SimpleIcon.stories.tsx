import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { EditIcon } from '../../../packages/ui/src/icons/Edit'
import { PlusIcon } from '../../../packages/ui/src/icons/Plus'
import { TrashIcon } from '../../../packages/ui/src/icons/Trash'

const meta = {
  parameters: {
    layout: 'centered',
  },
  title: 'UI/Icons/Simple Icon Test',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const IconShowcase: Story = {
  render: () => {
    return (
      <div style={{ background: '#f0f0f0', padding: '20px' }}>
        <h3>Icon Component Tests</h3>
        <div style={{ alignItems: 'center', display: 'flex', gap: '20px', margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon />
            <div>Plus Icon</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <EditIcon />
            <div>Edit Icon</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <TrashIcon />
            <div>Trash Icon</div>
          </div>
        </div>

        <h4>Different Sizes</h4>
        <div style={{ alignItems: 'center', display: 'flex', gap: '20px', margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ height: '16px', width: '16px' }} />
            <div>Small (16px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ height: '24px', width: '24px' }} />
            <div>Medium (24px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ height: '32px', width: '32px' }} />
            <div>Large (32px)</div>
          </div>
        </div>

        <h4>Different Colors</h4>
        <div style={{ alignItems: 'center', display: 'flex', gap: '20px', margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: '#007acc', height: '24px', width: '24px' }} />
            <div>Blue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: '#28a745', height: '24px', width: '24px' }} />
            <div>Green</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: '#dc3545', height: '24px', width: '24px' }} />
            <div>Red</div>
          </div>
        </div>
      </div>
    )
  },
}
