import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const hiddenField: Field = {
  name: 'secretToken',
  type: 'hidden',
  defaultValue: 'hidden-token',
} as Field

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: hiddenField,
    values: {
      secretToken: 'hidden-token',
    },
    width: 480,
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
          'Hidden fields store values in the form state without rendering UI. Use them for system metadata or derived values.',
      },
    },
  },
  title: 'Fields/Hidden',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
