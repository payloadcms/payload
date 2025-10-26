import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const richTextField: Field = {
  name: 'content',
  type: 'richText',
  admin: {
    description:
      'Pair this field with the `@payloadcms/richtext-lexical` package to render Payload’s rich text editor.',
  },
  label: 'Content',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: richTextField,
    values: {
      content: null,
    },
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
          'This story mounts the placeholder rich text field shipped with `@payloadcms/ui`. Install the Lexical or Slate packages to see the full editor in Storybook.',
      },
    },
  },
  title: 'Fields/RichText',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Placeholder: Story = {}
