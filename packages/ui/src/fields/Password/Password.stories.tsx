import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const passwordField: Field = {
  name: 'password',
  type: 'password',
  admin: {
    description: 'Uses a masked input and integrates with confirm-password validation when paired.',
  },
  label: 'Password',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: passwordField,
    values: {
      password: 'SuperSecret123!',
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
        component: 'Password fields handle secure entry, reveal toggles, and localized validation.',
      },
    },
  },
  title: 'Fields/Password',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
