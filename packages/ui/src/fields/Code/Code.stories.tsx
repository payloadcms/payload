import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const codeField: Field = {
  name: 'snippet',
  type: 'code',
  admin: {
    description:
      'Powered by Monaco, the code field adds syntax highlighting, tabs, and formatting.',
    language: 'json',
  },
  label: 'Snippet',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: codeField,
    values: {
      snippet: '{\n  "hello": "payload"\n}',
    },
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
        component: 'Code fields leverage Monaco Editor for JSON, JS, or custom languages.',
      },
    },
  },
  title: 'Fields/Code',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const JSONExample: Story = {}
