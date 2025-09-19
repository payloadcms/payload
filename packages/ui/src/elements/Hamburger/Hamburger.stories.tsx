import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Hamburger } from '../Hamburger/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Hamburger> = {
  args: {
    isActive: false,
  },
  argTypes: {
    closeIcon: {
      control: 'select',
      description: 'Type of close icon to display',
      options: ['collapse', 'x'],
    },
    isActive: {
      control: 'boolean',
      description: 'Whether the hamburger menu is in active state',
    },
  },
  component: Hamburger,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A hamburger menu component that toggles between open and close states.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Hamburger',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Inactive: Story = {
  args: {
    isActive: false,
  },
}

export const Active: Story = {
  args: {
    isActive: true,
  },
}

export const ActiveWithX: Story = {
  args: {
    closeIcon: 'x',
    isActive: true,
  },
}

export const ActiveWithCollapse: Story = {
  args: {
    closeIcon: 'collapse',
    isActive: true,
  },
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [isActive, setIsActive] = useState(false)
    const [closeIcon, setCloseIcon] = useState<'collapse' | 'x'>('x')

    return (
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
          <Hamburger closeIcon={closeIcon} isActive={isActive} />
          <button
            onClick={() => setIsActive(!isActive)}
            style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            Toggle Menu
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCloseIcon('x')}
            style={{
              backgroundColor: closeIcon === 'x' ? '#0066cc' : '#f8f9fa',
              border: '1px solid #ccc',
              borderRadius: '4px',
              color: closeIcon === 'x' ? 'white' : 'black',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            X Icon
          </button>
          <button
            onClick={() => setCloseIcon('collapse')}
            style={{
              backgroundColor: closeIcon === 'collapse' ? '#0066cc' : '#f8f9fa',
              border: '1px solid #ccc',
              borderRadius: '4px',
              color: closeIcon === 'collapse' ? 'white' : 'black',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Collapse Icon
          </button>
        </div>

        <div style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
          <p>State: {isActive ? 'Active' : 'Inactive'}</p>
          <p>Close Icon: {closeIcon}</p>
        </div>
      </div>
    )
  },
}

// Different sizes
export const Small: Story = {
  args: {
    isActive: false,
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <div style={{ transform: 'scale(0.75)' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

export const Large: Story = {
  args: {
    isActive: false,
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <div style={{ transform: 'scale(1.5)' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

// In context examples
export const InNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Hamburger menu in a navigation context.',
      },
    },
  },
  render: () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Navigation header */}
        <div
          style={{
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}
        >
          <h2 style={{ fontSize: '18px', margin: 0 }}>My App</h2>
          <Hamburger
            closeIcon="x"
            isActive={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </div>

        {/* Navigation menu */}
        {isMenuOpen && (
          <div style={{ backgroundColor: 'white', padding: '20px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Dashboard
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Documents
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Settings
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Profile
              </button>
            </nav>
          </div>
        )}
      </div>
    )
  },
}

export const InSidebar: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Hamburger menu in a sidebar context.',
      },
    },
  },
  render: () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
      <div style={{ display: 'flex', height: '300px' }}>
        {/* Sidebar */}
        <div
          style={{
            backgroundColor: '#2c3e50',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            width: isSidebarOpen ? '250px' : '60px',
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              alignItems: 'center',
              borderBottom: '1px solid #34495e',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px',
            }}
          >
            {isSidebarOpen && <h3 style={{ fontSize: '16px', margin: 0 }}>Menu</h3>}
            <Hamburger
              closeIcon="collapse"
              isActive={isSidebarOpen}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>

          {/* Sidebar content */}
          {isSidebarOpen && (
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Dashboard
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Documents
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Settings
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px 0',
                  textAlign: 'left',
                  textDecoration: 'none',
                }}
                type="button"
              >
                Profile
              </button>
            </nav>
          )}
        </div>

        {/* Main content */}
        <div style={{ backgroundColor: '#f8f9fa', flex: 1, padding: '20px' }}>
          <h2>Main Content</h2>
          <p>This is the main content area. The sidebar can be toggled using the hamburger menu.</p>
        </div>
      </div>
    )
  },
}

// All variants showcase
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available hamburger menu variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Basic states */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Basic States</h3>
        <div style={{ alignItems: 'center', display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Inactive</p>
            <Hamburger isActive={false} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Active (X)</p>
            <Hamburger closeIcon="x" isActive={true} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Active (Collapse)</p>
            <Hamburger closeIcon="collapse" isActive={true} />
          </div>
        </div>
      </div>

      {/* Different sizes */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Different Sizes</h3>
        <div style={{ alignItems: 'center', display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Small</p>
            <div style={{ transform: 'scale(0.75)' }}>
              <Hamburger isActive={false} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Normal</p>
            <Hamburger isActive={false} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Large</p>
            <div style={{ transform: 'scale(1.5)' }}>
              <Hamburger isActive={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive demo */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Interactive Demo</h3>
        <div
          style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <Hamburger closeIcon="x" isActive={false} />
            <span>Click to toggle (simulated)</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
            <Hamburger closeIcon="collapse" isActive={true} />
            <span>Collapse variant (simulated)</span>
          </div>
        </div>
      </div>
    </div>
  ),
}
