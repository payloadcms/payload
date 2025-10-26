import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'
import { ConfirmPasswordField } from './index.js'

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    children: <ConfirmPasswordField />,
    values: {
      'confirm-password': {
        value: 'PayloadRocks123',
      },
      password: 'PayloadRocks123',
    },
    width: 480,
  },
  argTypes: {
    children: { control: false },
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
          'Confirm password is a helper field used in auth flows to match the main password input.',
      },
    },
  },
  title: 'Fields/ConfirmPassword',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
