import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const uploadField: Field = {
  name: 'heroImage',
  type: 'upload',
  admin: {
    description: 'Upload fields connect to an upload-enabled collection to manage media.',
  },
  label: 'Hero image',
  relationTo: 'media',
}

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    field: uploadField,
    values: {
      heroImage: 'media-doc-id',
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
          'Upload fields re-use the Relationship UI but surface upload-specific actions like editing metadata or creating new assets.',
      },
    },
  },
  title: 'Fields/Upload',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const Basic: Story = {}
