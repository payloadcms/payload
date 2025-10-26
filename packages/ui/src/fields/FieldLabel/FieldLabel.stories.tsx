import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'
import { FieldLabel } from './index.js'

const meta: Meta<typeof FieldLabel> = {
  args: {
    label: 'Field label',
    path: 'demo',
    required: true,
  },
  component: FieldLabel,
  decorators: [
    (Story) => (
      <FieldStoryWrapper fields={[]} values={{ demo: null }} width={480}>
        <Story />
      </FieldStoryWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'FieldLabel renders labels with optional required and locale indicators.',
      },
    },
  },
  title: 'Fields/FieldLabel',
}

export default meta

type Story = StoryObj<typeof FieldLabel>

export const Basic: Story = {}
