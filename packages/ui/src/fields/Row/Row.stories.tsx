import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const rowField: Field = {
  type: 'row',
  admin: {
    description: 'Row fields place child fields side-by-side with responsive breakpoints.',
  },
  fields: [
    {
      name: 'ctaLabel',
      type: 'text',
      label: 'CTA label',
      required: true,
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'CTA link',
    },
  ],
} as Field

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    fields: [rowField],
    values: {
      ctaLabel: 'Get started',
      ctaLink: '/docs',
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
          'Row is a layout field that renders its children in columns within the admin UI.',
      },
    },
  },
  title: 'Fields/Row',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const TwoColumns: Story = {}
