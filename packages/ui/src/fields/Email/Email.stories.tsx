import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const emailField: Field = {
  name: 'authorEmail',
  type: 'email',
  admin: {
    description: 'Email fields normalize casing and include built-in validation messaging.',
    placeholder: 'author@example.com',
  },
  label: 'Author email',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: emailField,
    values: {
      authorEmail: 'stories@payloadcms.com',
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
          'Email fields wrap the text field with type="email" semantics for improved validation.',
      },
    },
  },
  title: 'Fields/Email',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
