import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const collapsibleField: Field = {
  type: 'collapsible',
  admin: {
    description: 'Collapsible groups hide less-used settings behind a disclosure.',
  },
  fields: [
    {
      name: 'cacheTTL',
      type: 'number',
      label: 'Cache TTL',
    },
    {
      name: 'trackImpressions',
      type: 'checkbox',
      label: 'Track impressions',
    },
  ],
  label: 'Advanced settings',
} as Field

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    fields: [collapsibleField],
    values: {
      cacheTTL: 3600,
      trackImpressions: true,
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
        component: 'Collapsible wraps groups of fields in an accordion pattern.',
      },
    },
  },
  title: 'Fields/Collapsible',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
