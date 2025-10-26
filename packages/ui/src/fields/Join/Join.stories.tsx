import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const joinField: Field = {
  name: 'notes',
  type: 'join',
  admin: {
    allowCreate: false,
    description: 'Join fields surface related documents based on a backing relationship.',
  },
  collection: 'notes',
  label: 'Notes',
  on: 'post',
  targetField: {
    relationTo: 'posts',
  },
} as Field

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: joinField,
    values: {
      notes: {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10,
        nextPage: null,
        page: 1,
        pagingCounter: 1,
        prevPage: null,
        totalDocs: 0,
        totalPages: 1,
      },
    },
    width: 800,
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
          'Join fields read from another collection where a relationship points back to the current document.',
      },
    },
  },
  title: 'Fields/Join',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const EmptyState: Story = {}
