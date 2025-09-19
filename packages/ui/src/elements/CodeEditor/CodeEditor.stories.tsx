import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { CodeEditor } from './index.js'

const meta: Meta<typeof CodeEditor> = {
  component: CodeEditor,
  parameters: {
    docs: {
      description: {
        component:
          'A Monaco-based code editor component that automatically adjusts its height based on content and supports both light and dark themes.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/CodeEditor',
}

export default meta

type Story = StoryObj<typeof CodeEditor>

const containerStyles: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  justifyContent: 'center',
  margin: '0 auto',
  maxWidth: '800px',
  minHeight: '100vh',
  padding: '20px',
  width: '100%',
}

const sampleCode = `// Example configuration
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}`

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of CodeEditor showing JSON editing with syntax highlighting and automatic height adjustment.',
      },
    },
  },
  render: () => {
    return (
      <div style={containerStyles}>
        <CodeEditor
          defaultLanguage="json"
          defaultValue={sampleCode}
          onChange={(value) => {
            console.log('Editor content:', value)
          }}
          options={{
            padding: {
              bottom: 8,
              top: 8,
            },
          }}
        />
        <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px' }}>
          Try editing the JSON configuration above. The editor will automatically resize.
        </div>
      </div>
    )
  },
}
