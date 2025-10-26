import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const selectField: Field = {
  name: 'status',
  type: 'select',
  admin: {
    description: 'Select fields support static or async options plus multi-select mode.',
  },
  defaultValue: 'draft',
  label: 'Status',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'In Review', value: 'review' },
    { label: 'Published', value: 'published' },
  ],
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: selectField,
    values: {
      status: 'review',
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
        component:
          'Select fields can be single or multi-value, integrate with `filterOptions`, and inherit theming from React Select.',
      },
    },
  },
  title: 'Fields/Select',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
