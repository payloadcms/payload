import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Field, TabAsField } from 'payload'

import { FieldStoryWrapper } from '../storyHelpers/FieldStoryWrapper.js'

const tabsField: TabAsField = {
  type: 'tabs',
  tabs: [
    {
      fields: [
        {
          name: 'intro',
          type: 'textarea',
          label: 'Intro',
        },
      ],
      label: 'Content',
    },
    {
      fields: [
        {
          name: 'ctaText',
          type: 'text',
          label: 'CTA text',
        },
      ],
      label: 'Sidebar',
    },
  ],
} as TabAsField

const meta: Meta<typeof FieldStoryWrapper> = {
  args: {
    fields: [tabsField as unknown as Field],
    values: {
      ctaText: 'Contact sales',
      intro: 'Tabs organize long forms into digestible sections.',
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
        component: 'Tabs mirror the admin tabs UI for splitting complex forms.',
      },
    },
  },
  title: 'Fields/Tabs',
}

export default meta

type Story = StoryObj<typeof FieldStoryWrapper>

export const TwoTabs: Story = {}
