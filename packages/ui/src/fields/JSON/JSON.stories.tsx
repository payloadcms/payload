import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const jsonField: Field = {
  name: 'settings',
  type: 'json',
  admin: {
    description: 'JSON field is a lightweight editor for structured objects without syntax help.',
  },
  label: 'Settings',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: jsonField,
    values: {
      settings: {
        features: ['revisions', 'livePreview'],
        theme: 'dark',
      },
    },
    width: 720,
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
        component: 'JSON fields accept raw JSON that is parsed/validated on change.',
      },
    },
  },
  title: 'Fields/JSON',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
