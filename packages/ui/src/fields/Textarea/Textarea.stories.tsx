import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const textareaField: Field = {
  name: 'summary',
  type: 'textarea',
  admin: {
    description: 'Multi-line text area with automatic resizing and markdown shortcuts.',
    placeholder: 'Write a short elevator pitch.',
  },
  label: 'Summary',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: textareaField,
    values: {
      summary:
        'Payload UI ships with every field already wired to Storybook so you can iterate quickly.',
    },
    width: 640,
  },
  argTypes: {
    field: { control: false },
    fields: { control: false },
    initialData: { control: false },
    initialState: { control: false },
    style: { control: false },
    values: { control: false },
    width: { control: 'text' },
  },
  component: FieldStoryWrapper,
  parameters: {
    docs: {
      description: {
        component:
          'Textarea fields are ideal for medium-length content and honor localization, validation, and custom components.',
      },
    },
  },
  title: 'Fields/Textarea',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
