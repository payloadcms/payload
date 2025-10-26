import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const textField: Field = {
  name: 'title',
  type: 'text',
  admin: {
    description: 'Standard text input with localization and validation support.',
    placeholder: 'Introducing Payload UI',
  },
  label: 'Title',
  required: true,
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: textField,
    values: {
      title: 'Payload UI field stories',
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
          'The text field powers single-line inputs across the admin UI, inheriting localization, validation, and custom component hooks.',
      },
    },
  },
  title: 'Fields/Text',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A required text field with placeholder text and a pre-filled value.',
      },
    },
  },
}
