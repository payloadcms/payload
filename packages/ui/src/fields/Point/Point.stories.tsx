import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const pointField: Field = {
  name: 'location',
  type: 'point',
  admin: {
    description: 'Point fields capture longitude/latitude pairs with map previews.',
  },
  label: 'Location',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: pointField,
    values: {
      location: [12.4924, 41.8902],
    },
    width: 520,
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
        component: 'Point fields store GeoJSON-compatible coordinates and render an inline map.',
      },
    },
  },
  title: 'Fields/Point',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
