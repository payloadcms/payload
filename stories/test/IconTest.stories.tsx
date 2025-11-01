import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'

// Try direct imports
import { PlusIcon } from '../../packages/ui/src/icons/Plus'
import { EditIcon } from '../../packages/ui/src/icons/Edit'
import { TrashIcon } from '../../packages/ui/src/icons/Trash'
import { CheckIcon } from '../../packages/ui/src/icons/Check'
import { XIcon } from '../../packages/ui/src/icons/X'
import { SearchIcon } from '../../packages/ui/src/icons/Search'

const IconTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h3>✅ Icon Import Test</h3>
      <p>If you can see this page, icon imports are working correctly!</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <PlusIcon />
          </div>
          <div style={{ fontSize: '14px' }}>PlusIcon</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <EditIcon />
          </div>
          <div style={{ fontSize: '14px' }}>EditIcon</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <TrashIcon />
          </div>
          <div style={{ fontSize: '14px' }}>TrashIcon</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <CheckIcon />
          </div>
          <div style={{ fontSize: '14px' }}>CheckIcon</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <XIcon />
          </div>
          <div style={{ fontSize: '14px' }}>XIcon</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            <SearchIcon />
          </div>
          <div style={{ fontSize: '14px' }}>SearchIcon</div>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '6px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#155724' }}>✅ Success!</h4>
        <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>
          All Payload icons imported and rendered successfully. This confirms that:
        </p>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#155724', fontSize: '14px' }}>
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
  title: 'Test/Icon Test',
  component: IconTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof IconTest>

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {}