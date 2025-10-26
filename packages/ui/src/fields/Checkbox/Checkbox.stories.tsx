import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const checkboxField: Field = {
  name: 'featured',
  type: 'checkbox',
  admin: {
    description: 'Toggles boolean flags and supports indeterminate states when used with locales.',
  },
  defaultValue: true,
  label: 'Featured article',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: checkboxField,
    values: {
      featured: true,
    },
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
        component: 'Checkbox fields capture booleans with optional descriptions and custom labels.',
      },
    },
  },
  title: 'Fields/Checkbox',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Checked: Story = {
  args: {
    submitted: false,
  },
}
