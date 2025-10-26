import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const numberField: Field = {
  name: 'viewCount',
  type: 'number',
  admin: {
    description: 'Number fields support min/max constraints, steps, and localization.',
    placeholder: '0',
    step: 1,
  },
  label: 'View count',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: numberField,
    values: {
      viewCount: 4200,
    },
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
          'Number inputs enforce numeric validation and integrate with locale-aware formatting.',
      },
    },
  },
  title: 'Fields/Number',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
