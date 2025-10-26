import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field, Row } from 'payload'

import { buildFormState, FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const authorsField: Field = {
  name: 'authors',
  type: 'array',
  admin: {
    description: 'Array fields manage repeatable sets of subfields with drag-and-drop reordering.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      label: 'Role',
    },
  ],
  label: 'Authors',
  labels: {
    plural: 'Authors',
    singular: 'Author',
  },
}

const arrayRows: Row[] = [
  {
    id: 'author-row-1',
    collapsed: false,
    lastRenderedPath: 'authors.0',
  },
  {
    id: 'author-row-2',
    collapsed: false,
    lastRenderedPath: 'authors.1',
  },
]

const arrayState = buildFormState({
  authors: {
    initialValue: arrayRows.length,
    rows: arrayRows,
    value: arrayRows.length,
  },
  'authors.0.id': 'author-row-1',
  'authors.0.name': 'Ada Lovelace',
  'authors.0.role': 'Lead developer',
  'authors.1.id': 'author-row-2',
  'authors.1.name': 'Alan Turing',
  'authors.1.role': 'Reviewer',
})

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: authorsField,
    initialState: arrayState,
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
        component:
          'Array fields provide repeatable fieldsets with drag handles, row duplication, and clipboard helpers.',
      },
    },
  },
  title: 'Fields/Array',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const WithRows: Story = {}
