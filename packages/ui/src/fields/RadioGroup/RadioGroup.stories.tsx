import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const radioGroupField: Field = {
  name: 'priority',
  type: 'radio',
  admin: {
    description: 'Radio groups are ideal for short mutually exclusive choices.',
    layout: 'horizontal',
  },
  label: 'Priority',
  options: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ],
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: radioGroupField,
    values: {
      priority: 'medium',
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
        component: 'Radio groups present stacked or inline selections with built-in accessibility.',
      },
    },
  },
  title: 'Fields/RadioGroup',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Horizontal: Story = {}
