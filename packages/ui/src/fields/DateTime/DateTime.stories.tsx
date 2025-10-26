import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const dateField: Field = {
  name: 'publishedOn',
  type: 'date',
  admin: {
    description: 'DateTime fields include time pickers, localization, and timezone-awareness.',
    pickerAppearance: 'dayOnly',
  },
  label: 'Published on',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: dateField,
    values: {
      publishedOn: '2024-04-01T12:00:00.000Z',
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
          'DateTime merges a text input with the shared date picker for consistent scheduling UX.',
      },
    },
  },
  title: 'Fields/DateTime',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
