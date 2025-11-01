import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { Banner } from '../../packages/ui/src/elements/Banner'
// Import all the components we've showcased
import { Button } from '../../packages/ui/src/elements/Button'
import { Card } from '../../packages/ui/src/elements/Card'
import { Collapsible } from '../../packages/ui/src/elements/Collapsible'
import { LoadingOverlay } from '../../packages/ui/src/elements/Loading'
import { Modal } from '../../packages/ui/src/elements/Modal'
import { SearchBar } from '../../packages/ui/src/elements/SearchBar'
import { Tooltip } from '../../packages/ui/src/elements/Tooltip'
import { CheckboxInput } from '../../packages/ui/src/fields/Checkbox/Input'
import { FieldError } from '../../packages/ui/src/fields/FieldError'
// Import field components
import { FieldLabel } from '../../packages/ui/src/fields/FieldLabel'
// Note: TextInput, TextareaInput, SelectInput, NumberField, DateTimeField have full story suites

import { CheckIcon, EditIcon, PlusIcon, SearchIcon, XIcon } from '@payloadcms/ui'
// Import icons - keep TrashIcon as direct import since it's not exported from main package
import { TrashIcon } from '../../packages/ui/src/icons/Trash'
import { PayloadMockProviders } from '../_mocks/MockProviders'

const meta = {
  parameters: {
    docs: {
      description: {
        component:
          'Comprehensive showcase of all Payload CMS UI components available in Storybook.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Overview/Component Showcase',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AllComponents: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      newsletter: false,
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
      const errors: Record<string, string> = {}

      if (!formData.name) {
        errors.name = 'Name is required'
      }
      if (!formData.email) {
        errors.email = 'Email is required'
      } else if (!/\S[^\s@]*@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email format'
      }

      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setLoading(false)
      setShowModal(false)

      // Reset form
      setFormData({ name: '', email: '', newsletter: false })
    }

    return (
      <PayloadMockProviders>
        <div
          style={{
            backgroundColor: '#f7fafc',
            minHeight: '100vh',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0',
              padding: '16px 24px',
            }}
          >
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
              Payload CMS Component Library
            </h1>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              Interactive showcase of UI components built for Payload CMS
            </p>
          </div>

          {/* Search Bar */}
          <div
            style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0',
              padding: '16px 24px',
            }}
          >
            <SearchBar
              Actions={[
                <Button buttonStyle="secondary" key="filter" size="small">
                  Filter
                </Button>,
              ]}
              label="Search components..."
              onSearchChange={setSearchTerm}
            />
          </div>

          {/* Banners */}
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ marginBottom: '16px' }}>Status Messages</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Banner icon={<CheckIcon />} type="success">
                  All components loaded successfully!
                </Banner>
                <Banner icon={<EditIcon />} type="info">
                  {searchTerm
                    ? `Searching for: "${searchTerm}"`
                    : 'Use the search bar above to filter components'}
                </Banner>
              </div>
            </div>

            {/* Main Content Grid */}
            <div
              style={{
                display: 'grid',
                gap: '24px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              }}
            >
              {/* Buttons Card */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Interactive Buttons
                  </h3>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Button buttonStyle="primary" icon="plus">
                      Primary
                    </Button>
                    <Button buttonStyle="secondary">Secondary</Button>
                    <Button buttonStyle="pill" size="small">
                      Pill Style
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Tooltip position="top" show={true}>
                      This button has a tooltip!
                      <Button buttonStyle="primary" size="small">
                        Hover Me
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Form Components Card */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Form Components
                  </h3>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}
                >
                  <div>
                    <FieldLabel label="Sample Form Field" required={true} />
                    <input
                      placeholder="Enter some text"
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        padding: '8px 12px',
                        width: '100%',
                      }}
                      type="text"
                    />
                  </div>

                  <CheckboxInput
                    checked={formData.newsletter}
                    label="Subscribe to newsletter"
                    onToggle={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newsletter: e.target.checked,
                      }))
                    }
                  />

                  <FieldError message="This is how form errors are displayed" />
                </div>
              </div>

              {/* Icons Showcase Card */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Icon Collection
                  </h3>
                </div>
                <div
                  style={{
                    alignItems: 'center',
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                    padding: '16px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <PlusIcon />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Plus</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EditIcon />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Edit</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <CheckIcon />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Check</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <XIcon />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Close</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <SearchIcon />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Search</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <TrashIcon />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Trash</div>
                  </div>
                </div>
              </div>

              {/* Form Fields Showcase Card */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Phase 1 Form Fields
                  </h3>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}
                >
                  <div>
                    <h4 style={{ color: '#374151', marginBottom: '8px' }}>
                      Available Form Components
                    </h4>
                    <div style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
                      <div>
                        <strong>TextInput:</strong> 5 stories with validation patterns
                      </div>
                      <div>
                        <strong>TextareaInput:</strong> 4 stories with dynamic features
                      </div>
                      <div>
                        <strong>SelectInput:</strong> 5 stories with multi-select
                      </div>
                      <div>
                        <strong>NumberField:</strong> 4 stories with currency/percentage
                      </div>
                      <div>
                        <strong>DateTimeField:</strong> 4 stories with ranges/scheduling
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #e0f2fe',
                      borderRadius: '6px',
                      fontSize: '14px',
                      padding: '12px',
                    }}
                  >
                    💡 <strong>Tip:</strong> Navigate to "UI/Fields" in the sidebar to explore all
                    21+ interactive form field examples with real validation, error handling, and
                    practical use cases.
                  </div>
                </div>
              </div>

              {/* Interactive Demo Card */}
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px',
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    Interactive Demo
                  </h3>
                  <Button buttonStyle="primary" onClick={() => setShowModal(true)} size="small">
                    Open Modal
                  </Button>
                </div>
                <div style={{ padding: '16px' }}>
                  <p>Click the "Open Modal" button to see modal functionality.</p>
                  <p>This demonstrates how different components work together.</p>
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ marginBottom: '16px' }}>Expandable Content</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Collapsible header="Component Features" initCollapsed={false}>
                  <div style={{ padding: '16px' }}>
                    <h4>UI Elements (9 Components)</h4>
                    <ul>
                      <li>✅ Interactive buttons (4+ styles, sizes, icons)</li>
                      <li>✅ Cards with headers, actions, and content</li>
                      <li>✅ Modal dialogs with confirmation support</li>
                      <li>✅ Tooltips with positioning options</li>
                      <li>✅ Loading overlays and spinners</li>
                      <li>✅ Status banners (success, error, info, warning)</li>
                      <li>✅ Search bars with action buttons</li>
                      <li>✅ Collapsible content sections</li>
                    </ul>

                    <h4>Form Fields (Phase 1 Complete - 5 Components)</h4>
                    <ul>
                      <li>✅ TextInput with validation (5 interactive stories)</li>
                      <li>✅ TextareaInput with dynamic resize (4 stories)</li>
                      <li>✅ SelectInput with multi-select (5 stories)</li>
                      <li>✅ NumberField with currency/percentage (4 stories)</li>
                      <li>✅ DateTimeField with ranges/scheduling (4 stories)</li>
                      <li>✅ Field helpers (Label, Error, Description, Checkbox)</li>
                    </ul>

                    <h4>Icons & Navigation</h4>
                    <ul>
                      <li>
                        ✅ Comprehensive icon library (Plus, Edit, Trash, Check, X, Search, etc.)
                      </li>
                      <li>✅ Icon showcase with interactive examples</li>
                      <li>✅ Consistent sizing and styling patterns</li>
                    </ul>
                  </div>
                </Collapsible>

                <Collapsible header="Implementation Details" initCollapsed={true}>
                  <div style={{ padding: '16px' }}>
                    <h4>Technical Implementation</h4>
                    <ul>
                      <li>Built with React 19 and TypeScript</li>
                      <li>Storybook 10.0.2 for component development</li>
                      <li>Next.js compatibility with proper mocking</li>
                      <li>SCSS styling with Payload design system</li>
                      <li>Full context provider setup</li>
                      <li>Interactive examples and documentation</li>
                    </ul>

                    <h4>Story Statistics</h4>
                    <ul>
                      <li>
                        <strong>Total Stories:</strong> 24 component story files
                      </li>
                      <li>
                        <strong>Phase 1 Form Fields:</strong> 21+ interactive examples
                      </li>
                      <li>
                        <strong>UI Elements:</strong> 9 core components with multiple variations
                      </li>
                      <li>
                        <strong>Icons:</strong> 6+ icons with showcase and individual stories
                      </li>
                      <li>
                        <strong>Coverage:</strong> All major Payload UI patterns implemented
                      </li>
                    </ul>

                    <h4>Component Categories</h4>
                    <ul>
                      <li>
                        <strong>UI Elements:</strong> Button, Card, Modal, Tooltip, Banner,
                        LoadingOverlay, SearchBar, Collapsible
                      </li>
                      <li>
                        <strong>Form Fields:</strong> TextInput, TextareaInput, SelectInput,
                        NumberField, DateTimeField + helpers
                      </li>
                      <li>
                        <strong>Field Helpers:</strong> FieldLabel, FieldError, FieldDescription,
                        CheckboxInput
                      </li>
                      <li>
                        <strong>Icons:</strong> Plus, Edit, Trash, Check, X, Search + IconShowcase
                      </li>
                      <li>
                        <strong>Infrastructure:</strong> MockProviders, Next.js mocks, SCSS
                        integration
                      </li>
                    </ul>
                  </div>
                </Collapsible>
              </div>
            </div>
          </div>

          {/* Modal */}
          {showModal && (
            <Modal slug="demo-modal">
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  left: 0,
                  position: 'fixed',
                  right: 0,
                  top: 0,
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    maxHeight: '80vh',
                    maxWidth: '500px',
                    overflow: 'auto',
                    width: '90%',
                  }}
                >
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ marginTop: 0 }}>Sample Form Modal</h3>

                    <div style={{ marginBottom: '16px' }}>
                      <FieldLabel label="Name" required={true} />
                      <input
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your name"
                        style={{
                          border: formErrors.name ? '1px solid #e53e3e' : '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          padding: '8px 12px',
                          width: '100%',
                        }}
                        type="text"
                        value={formData.name}
                      />
                      {formErrors.name && <FieldError message={formErrors.name} />}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <FieldLabel label="Email" required={true} />
                      <input
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="Enter your email"
                        style={{
                          border: formErrors.email ? '1px solid #e53e3e' : '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          padding: '8px 12px',
                          width: '100%',
                        }}
                        type="email"
                        value={formData.email}
                      />
                      {formErrors.email && <FieldError message={formErrors.email} />}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <CheckboxInput
                        checked={formData.newsletter}
                        label="Subscribe to newsletter updates"
                        onToggle={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            newsletter: e.target.checked,
                          }))
                        }
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <Button
                        buttonStyle="secondary"
                        disabled={loading}
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button buttonStyle="primary" disabled={loading} onClick={handleSubmit}>
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {/* Loading Overlay */}
          {loading && <LoadingOverlay loadingText="Saving your information..." show={true} />}
        </div>
      </PayloadMockProviders>
    )
  },
}
