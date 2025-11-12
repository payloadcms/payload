import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { EditIcon, PlusIcon } from '@payloadcms/ui'
import React from 'react'
// Keep TrashIcon as direct import since it's not exported from main package
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
      <div style={{ background: 'var(--theme-elevation-50)', padding: '20px' }}>
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
            <PlusIcon style={{ color: 'var(--theme-input-bg)', height: '24px', width: '24px' }} />
            <div>Blue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon
              style={{ color: 'var(--theme-success-500)', height: '24px', width: '24px' }}
            />
            <div>Green</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PlusIcon style={{ color: 'var(--theme-error-500)', height: '24px', width: '24px' }} />
            <div>Red</div>
          </div>
        </div>
      </div>
    )
  },
}
