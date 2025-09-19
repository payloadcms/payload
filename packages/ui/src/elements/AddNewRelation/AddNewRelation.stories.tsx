import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ValueWithRelation } from 'payload'

import React from 'react'

import { AddNewRelation } from './index.js'

const meta: Meta<typeof AddNewRelation> = {
  argTypes: {
    Button: {
      control: false,
      description: 'Custom button component to render instead of the default plus icon button.',
      table: {
        type: { summary: 'React.ReactNode' },
        category: 'Customization',
      },
    },
    hasMany: {
      control: 'boolean',
      description:
        'Whether this relationship can have multiple values. When true, allows adding multiple related documents.',
      table: {
        type: { summary: 'boolean' },
        category: 'Core',
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      action: 'changed',
      description:
        'Callback function called when a new relation is added. Receives the new relation value.',
      table: {
        type: { summary: '(value: ValueWithRelation | ValueWithRelation[]) => void' },
        category: 'Core',
      },
    },
    path: {
      control: 'text',
      description: 'Field path for the relationship. Used for form integration and validation.',
      table: {
        type: { summary: 'string' },
        category: 'Core',
      },
    },
    relationTo: {
      control: 'text',
      description:
        'Collection slug(s) this relationship points to. Can be a single string or array of strings.',
      table: {
        type: { summary: 'string | string[]' },
        category: 'Core',
      },
    },
    unstyled: {
      control: 'boolean',
      description: 'Whether to render without default styling. Useful for custom implementations.',
      table: {
        type: { summary: 'boolean' },
        category: 'Customization',
        defaultValue: { summary: 'false' },
      },
    },
    value: {
      control: 'object',
      description:
        'Current relationship value(s). Can be null, single ValueWithRelation, or array of ValueWithRelation.',
      table: {
        type: { summary: 'ValueWithRelation | ValueWithRelation[] | null' },
        category: 'Core',
      },
    },
  },
  component: AddNewRelation,
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
          'A component for adding new related documents in relationship fields. Used extensively in PayloadCMS forms to create new related documents without leaving the current form.',
      },
    },
    layout: 'centered',
    payloadContext: true, // Enable PayloadCMS context providers
  },
  title: 'Elements/AddNewRelation',
}

export default meta
type Story = StoryObj<typeof AddNewRelation>

// Basic usage - single collection relationship
export const Basic: Story = {
  args: {
    hasMany: false,
    onChange: (value: ValueWithRelation) => {
      // eslint-disable-next-line no-console
      console.log('Added relation:', value)
    },
    path: 'author',
    relationTo: 'posts',
    value: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage for a single collection relationship. Shows the default plus icon button that opens a document drawer to create a new post. Click the button to see the document creation interface.',
      },
    },
  },
}
