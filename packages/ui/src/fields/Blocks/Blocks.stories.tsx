import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Block, Field, Row } from 'payload'

import { buildFormState, FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const contentBlock: Block = {
  slug: 'contentBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Body',
    },
  ],
  labels: {
    plural: 'Content blocks',
    singular: 'Content block',
  },
}

const blocksField: Field = {
  name: 'contentBlocks',
  type: 'blocks',
  admin: {
    description: 'Blocks let editors mix structured layouts with drag-and-drop ordering.',
  },
  blocks: [contentBlock],
  label: 'Content blocks',
}

const blocksRows: Row[] = [
  {
    id: 'block-row-1',
    blockType: 'contentBlock',
    collapsed: false,
    lastRenderedPath: 'contentBlocks.0',
  },
]

const blocksState = buildFormState({
  contentBlocks: {
    initialValue: blocksRows.length,
    rows: blocksRows,
    value: blocksRows.length,
  },
  'contentBlocks.0.blockType': 'contentBlock',
  'contentBlocks.0.body': 'Blocks can represent heroes, FAQs, cards, or any bespoke layout.',
  'contentBlocks.0.heading': 'Reusable content',
  'contentBlocks.0.id': 'block-row-1',
})

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: blocksField,
    initialState: blocksState,
    width: 760,
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
          'Blocks combine multiple fieldsets into draggable slices, mirroring the editor experience inside Storybook.',
      },
    },
  },
  title: 'Fields/Blocks',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const SingleBlock: Story = {}
