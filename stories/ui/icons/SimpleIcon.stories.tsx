import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { PlusIcon } from '../../../packages/ui/src/icons/Plus'
import { EditIcon } from '../../../packages/ui/src/icons/Edit'
import { TrashIcon } from '../../../packages/ui/src/icons/Trash'

const meta = {
  title: 'UI/Icons/Simple Icon Test',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const IconShowcase: Story = {
  render: () => {
    return (
      <div style={{ padding: '20px', background: '#f0f0f0' }}>
        <h3>Icon Component Tests</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '20px 0' }}>
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
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            <div>Small (16px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ width: '24px', height: '24px' }} />
            <div>Medium (24px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ width: '32px', height: '32px' }} />
            <div>Large (32px)</div>
          </div>
        </div>
        
        <h4>Different Colors</h4>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: '#007acc', width: '24px', height: '24px' }} />
            <div>Blue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: '#28a745', width: '24px', height: '24px' }} />
            <div>Green</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: '#dc3545', width: '24px', height: '24px' }} />
            <div>Red</div>
          </div>
        </div>
      </div>
    )
  },
}