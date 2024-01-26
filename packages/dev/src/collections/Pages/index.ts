import { CollectionConfig } from 'payload/types'
import { CustomView } from './CustomView'
import { BeforeInput } from './BeforeInput'
import { AfterInput } from './AfterInput'
import { CustomField } from './CustomField'
import { CustomDescription } from './CustomDescription'
import { CustomLabel } from './CustomLabel'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    components: {
      views: {
        Edit: {
          Custom: {
            path: '/custom',
            Component: CustomView,
            Tab: {
              label: 'Custom View',
              href: '/custom',
            },
          },
        },
      },
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'titleWithCustomComponents',
      label: 'Title With Custom Components',
      type: 'text',
      required: true,
      admin: {
        description: CustomDescription,
        components: {
          beforeInput: [BeforeInput],
          afterInput: [AfterInput],
          Label: CustomLabel,
        },
      },
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      admin: {
        description: 'This is a description',
      },
    },
    {
      name: 'titleWithCustomField',
      label: 'Title With Custom Field',
      type: 'text',
      admin: {
        components: {
          Field: CustomField,
        },
      },
    },
    {
      name: 'sidebarTitle',
      label: 'Sidebar Title',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'enableConditionalField',
      label: 'Enable Conditional Field',
      type: 'checkbox',
    },
    {
      name: 'conditionalField',
      label: 'Conditional Field',
      type: 'text',
      admin: {
        condition: (data) => data.enableConditionalField,
      },
    },
    {
      name: 'number',
      label: 'Number',
      type: 'number',
      required: true,
    },
    {
      name: 'select',
      label: 'Select',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Option 1',
          value: 'option-1',
        },
        {
          label: 'Option 2',
          value: 'option-2',
        },
      ],
    },
    {
      type: 'textarea',
      name: 'textarea',
      label: 'Textarea',
      required: true,
      admin: {
        rows: 10,
      },
    },
    {
      type: 'point',
      name: 'point',
      label: 'Point',
      required: true,
    },
    {
      type: 'radio',
      name: 'radio',
      label: 'Radio',
      required: true,
      options: [
        {
          label: 'Option 1',
          value: 'option-1',
        },
        {
          label: 'Option 2',
          value: 'option-2',
        },
      ],
    },
    {
      name: 'json',
      label: 'JSON',
      type: 'json',
      required: true,
    },
    {
      name: 'hidden',
      label: 'Hidden',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'code',
      label: 'Code',
      type: 'code',
      required: true,
    },
    {
      // TODO: fix this
      // label: ({ data }) => `This is ${data?.title || 'Untitled'}`,
      label: 'Hello',
      type: 'collapsible',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'collapsibleText',
          label: 'Collapsible Text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'group',
      label: 'Group',
      type: 'group',
      fields: [
        {
          name: 'groupText',
          label: 'Group Text',
          type: 'text',
          required: true,
        },
      ],
    },
    // {
    //   name: 'array',
    //   label: 'Array',
    //   type: 'array',
    //   required: true,
    //   fields: [
    //     {
    //       name: 'arrayText',
    //       label: 'Array Text',
    //       type: 'text',
    //       required: true,
    //     },
    //   ],
    // },
    {
      label: 'Tabs',
      type: 'tabs',
      tabs: [
        {
          name: 'tab1',
          label: 'Tab 1 (Named)',
          validate: (value) => true,
          fields: [
            {
              name: 'tab1Text',
              label: 'Tab 1 Text',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          label: 'Tab 2 (Unnamed)',
          fields: [
            {
              name: 'tab2Text',
              label: 'Tab 2 Text',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rowText1',
          label: 'Row Text',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'rowText2',
          label: 'Row Text',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
  ],
}
