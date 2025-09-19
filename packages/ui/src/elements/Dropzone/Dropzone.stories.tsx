import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Button } from '../Button/index.js'
import { Dropzone } from '../Dropzone/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Dropzone> = {
  args: {
    onChange: (_files: FileList) => {
      // Files selected action
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display inside the dropzone',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the dropzone is disabled',
    },
    dropzoneStyle: {
      control: 'select',
      description: 'Visual style of the dropzone',
      options: ['default', 'none'],
    },
    multipleFiles: {
      control: 'boolean',
      description: 'Whether to allow multiple file selection',
    },
    onChange: {
      action: 'filesChanged',
      description: 'Function called when files are selected',
    },
  },
  component: Dropzone,
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
        component:
          'A dropzone component that handles file drag and drop, paste, and click interactions.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Dropzone',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    children: 'Drop files here or click to select',
  },
}

export const WithCustomContent: Story = {
  args: {
    children: (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          <span aria-label="Folder icon" role="img">
            📁
          </span>
        </div>
        <h3 style={{ margin: '0 0 8px 0' }}>Upload Files</h3>
        <p style={{ color: '#666', margin: '0 0 16px 0' }}>
          Drag and drop files here, or click to browse
        </p>
        <Button buttonStyle="secondary">Choose Files</Button>
      </div>
    ),
  },
}

export const WithRichContent: Story = {
  args: {
    children: (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>
          <span aria-label="Cloud icon" role="img">
            ☁️
          </span>
        </div>
        <h2 style={{ margin: '0 0 12px 0' }}>Upload Your Files</h2>
        <p style={{ color: '#666', fontSize: '16px', margin: '0 0 20px 0' }}>
          Support for images, documents, and more
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button buttonStyle="primary">Select Files</Button>
          <Button buttonStyle="secondary">Browse Folder</Button>
        </div>
        <p style={{ color: '#999', fontSize: '14px', margin: '20px 0 0 0' }}>
          Maximum file size: 10MB
        </p>
      </div>
    ),
  },
}

// File handling
export const SingleFile: Story = {
  args: {
    children: 'Drop a single file here',
    multipleFiles: false,
  },
}

export const MultipleFiles: Story = {
  args: {
    children: 'Drop multiple files here',
    multipleFiles: true,
  },
}

// States
export const Disabled: Story = {
  args: {
    children: 'This dropzone is disabled',
    disabled: true,
  },
}

export const WithCustomStyle: Story = {
  args: {
    children: 'Custom styled dropzone',
    dropzoneStyle: 'none',
  },
}

export const WithCustomClassName: Story = {
  args: {
    children: 'Dropzone with custom class',
    className: 'custom-dropzone',
  },
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [files, setFiles] = useState<FileList | null>(null)
    const [isDragging, _setIsDragging] = useState(false)

    const handleFilesChange = (newFiles: FileList) => {
      setFiles(newFiles)
    }

    const clearFiles = () => {
      setFiles(null)
    }

    return (
      <div style={{ maxWidth: '500px', width: '100%' }}>
        <Dropzone onChange={handleFilesChange}>
          <div
            style={{
              backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
              border: isDragging ? '2px dashed #0066cc' : '2px dashed #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <span aria-label={isDragging ? 'Open folder icon' : 'Folder icon'} role="img">
                {isDragging ? '📂' : '📁'}
              </span>
            </div>
            <h3 style={{ margin: '0 0 8px 0' }}>
              {isDragging ? 'Drop files here!' : 'Upload Files'}
            </h3>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>
              Drag and drop files here, or click to browse
            </p>
            <Button buttonStyle="primary">Choose Files</Button>
          </div>
        </Dropzone>

        {files && files.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Selected Files:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from(files).map((file, index) => (
                <div
                  key={index}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{file.name}</span>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px' }}>
              <Button buttonStyle="secondary" onClick={clearFiles}>
                Clear Files
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  },
}

// Different sizes
export const Small: Story = {
  args: {
    children: (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
          <span aria-label="Folder icon" role="img">
            📁
          </span>
        </div>
        <p style={{ fontSize: '14px', margin: 0 }}>Drop files here</p>
      </div>
    ),
  },
}

export const Large: Story = {
  args: {
    children: (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '96px', marginBottom: '32px' }}>
          <span aria-label="Folder icon" role="img">
            📁
          </span>
        </div>
        <h1 style={{ margin: '0 0 16px 0' }}>Upload Your Files</h1>
        <p style={{ color: '#666', fontSize: '18px', margin: '0 0 24px 0' }}>
          Drag and drop files here, or click to browse
        </p>
        <Button buttonStyle="primary" size="large">
          Choose Files
        </Button>
      </div>
    ),
  },
}

// Different styles
export const Minimal: Story = {
  args: {
    children: (
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#666' }}>Drop files here</span>
      </div>
    ),
    dropzoneStyle: 'none',
  },
}

export const Styled: Story = {
  args: {
    children: (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          <span aria-label="Paint palette icon" role="img">
            🎨
          </span>
        </div>
        <h3 style={{ margin: '0 0 8px 0' }}>Styled Dropzone</h3>
        <p style={{ color: '#666', margin: 0 }}>Custom styled dropzone</p>
      </div>
    ),
    className: 'custom-dropzone',
  },
}

// All variants showcase
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available dropzone variants and configurations.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      }}
    >
      {/* Basic */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Basic</h3>
        <Dropzone onChange={() => {}}>
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            Drop files here
          </div>
        </Dropzone>
      </div>

      {/* Single file */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Single File</h3>
        <Dropzone multipleFiles={false} onChange={() => {}}>
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            Drop one file here
          </div>
        </Dropzone>
      </div>

      {/* Multiple files */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Multiple Files</h3>
        <Dropzone multipleFiles={true} onChange={() => {}}>
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            Drop multiple files here
          </div>
        </Dropzone>
      </div>

      {/* Disabled */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Disabled</h3>
        <Dropzone disabled={true} onChange={() => {}}>
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              opacity: 0.5,
              padding: '20px',
              textAlign: 'center',
            }}
          >
            Disabled dropzone
          </div>
        </Dropzone>
      </div>

      {/* Custom style */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Custom Style</h3>
        <Dropzone dropzoneStyle="none" onChange={() => {}}>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            No default styling
          </div>
        </Dropzone>
      </div>

      {/* Rich content */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Rich Content</h3>
        <Dropzone onChange={() => {}}>
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <span aria-label="Folder icon" role="img">
                📁
              </span>
            </div>
            <h3 style={{ margin: '0 0 8px 0' }}>Upload Files</h3>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>Drag and drop files here</p>
            <Button buttonStyle="primary" size="small">
              Choose Files
            </Button>
          </div>
        </Dropzone>
      </div>
    </div>
  ),
}
