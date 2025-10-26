import type { Meta, StoryObj } from '@storybook/react-vite'

import { FieldDescription } from './index.js'

const meta: Meta<typeof FieldDescription> = {
  args: {
    description: 'Use field descriptions to provide extra context or helper text.',
    path: 'demo',
  },
  component: FieldDescription,
  parameters: {
    docs: {
      description: {
        component:
          'FieldDescription renders helper text beneath field labels and supports markdown.',
      },
    },
  },
  title: 'Fields/FieldDescription',
}

export default meta

type Story = StoryObj<typeof FieldDescription>

export const Basic: Story = {}
