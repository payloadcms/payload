import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const groupField: Field = {
  name: 'seo',
  type: 'group',
  admin: {
    description: 'Groups collect several fields together with a shared label and description.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Meta title',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Meta description',
    },
  ],
  label: 'SEO',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: groupField,
    values: {
      'seo.description': 'Groups help organize related metadata or settings.',
      'seo.title': 'Documenting Payload fields',
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
    width: { control: false },
  },
  component: FieldStoryWrapper,
  parameters: {
    docs: {
      description: {
        component:
          'Groups wrap multiple inputs under a single label and manage nested field states.',
      },
    },
  },
  title: 'Fields/Group',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
