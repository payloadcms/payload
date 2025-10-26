import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const relationshipField: Field = {
  name: 'relatedPosts',
  type: 'relationship',
  admin: {
    description: 'Relationship fields source options from existing collections or globals.',
  },
  hasMany: true,
  label: 'Related posts',
  relationTo: 'posts',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: relationshipField,
    values: {
      relatedPosts: [
        {
          relationTo: 'posts',
          value: 'demo-post-id',
        },
      ],
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
          'Relationship fields support single or multi select, search, filters, and create-on-the-fly.',
      },
    },
  },
  title: 'Fields/Relationship',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const MultiSelect: Story = {}
