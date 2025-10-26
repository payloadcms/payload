import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'
import { FieldError } from './index.js'

const meta: Meta<typeof FieldError> = {
  args: {
    path: 'demo',
  },
  component: FieldError,
  decorators: [
    (Story) => (
      <FieldStoryWrapper
        fields={[]}
        submitted
        values={{
          demo: {
            errorMessage: 'This field is required.',
            initialValue: '',
            valid: false,
            value: '',
          },
        }}
        width={480}
      >
        <Story />
      </FieldStoryWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'FieldError displays inline validation messages tied to form state.',
      },
    },
  },
  title: 'Fields/FieldError',
}

export default meta

type Story = StoryObj<typeof FieldError>

export const Basic: Story = {}
