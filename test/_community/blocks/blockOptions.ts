import type { Field } from 'payload'

export const blockOptions: Field = {
  label: 'Options',
  type: 'collapsible',
  admin: { initCollapsed: true },
  fields: [
    {
      name: 'blockOptions',
      label: false,
      type: 'group',
      interfaceName: 'BlockOptions',
      fields: [
        {
          type: 'collapsible',
          label: 'Styling',
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'margin',
                  type: 'select',
                  options: [
                    { label: 'Small', value: 'sm' },
                    { label: 'Medium', value: 'md' },
                    { label: 'Large', value: 'lg' },
                  ],
                },
                {
                  name: 'padding',
                  type: 'select',
                  options: [
                    { label: 'Small', value: 'sm' },
                    { label: 'Medium', value: 'md' },
                    { label: 'Large', value: 'lg' },
                  ],
                  defaultValue: 'md',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'bg',
                  label: 'Background',
                  type: 'select',
                  options: [
                    { label: 'Default', value: 'default' },
                    { label: 'Standard', value: 'standard' },
                    { label: 'Inverted', value: 'inverted' },
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                  ],
                  defaultValue: 'default',
                },
                {
                  name: 'text',
                  type: 'select',
                  options: [
                    { label: 'Default', value: 'default' },
                    { label: 'Standard', value: 'standard' },
                    { label: 'Inverted', value: 'inverted' },
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                  ],
                  defaultValue: 'default',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showAt',
                  type: 'select',
                  options: [
                    { label: 'All', value: 'all' },
                    { label: 'Small', value: 'sm' },
                    { label: 'Medium', value: 'md' },
                    { label: 'Large', value: 'lg' },
                  ],
                },
                {
                  name: 'hideAt',
                  type: 'select',
                  options: [
                    { label: 'None', value: 'none' },
                    { label: 'Small', value: 'sm' },
                    { label: 'Medium', value: 'md' },
                    { label: 'Large', value: 'lg' },
                  ],
                },
              ],
            },
            {
              name: 'css',
              label: 'Custom CSS',
              type: 'code',
              admin: {
                language: 'css',
                description:
                  'Must be applied to a single class (any name). Example: .cool-stuff {color: "red", background-color: "black"}',
              },
            },
          ],
        },
        {
          name: 'anchorId',
          type: 'text',
          admin: {
            description:
              'Add an anchor ID to this container to link to it from another part of the page.',
          },
        },
      ],
    },
  ],
}
