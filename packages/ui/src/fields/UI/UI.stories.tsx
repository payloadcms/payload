import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import React from 'react'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const InfoCallout: React.FC = () => (
  <div
    style={{
      background: 'var(--theme-elevation-100)',
      borderRadius: 'var(--style-radius-m)',
      padding: '1rem',
    }}
  >
    UI fields render custom React components inside the form layout.
  </div>
)

const uiField: Field = {
  name: 'uiNote',
  type: 'ui',
  admin: {
    components: {
      Field: InfoCallout,
    },
  },
  label: 'Inline helper',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: uiField,
    width: 600,
  },
  argTypes: {
    field: { control: false },
    fields: { control: false },
    initialData: { control: false },
    initialState: { control: false },
    style: { control: false },
    values: { control: false },
    width: { control: false },
  },
  component: FieldStoryWrapper,
  parameters: {
    docs: {
      description: {
        component:
          'UI fields let you mount arbitrary React components wherever fields are allowed.',
      },
    },
  },
  title: 'Fields/UI',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const CustomComponent: Story = {}
