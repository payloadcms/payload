import type { Config } from 'payload/config'

import type { PluginConfig } from './types'

import deepMerge from './deepMerge'

const redirects =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => ({
    ...incomingConfig,
    collections: [
      ...(incomingConfig?.collections || []),
      deepMerge(
        {
          access: {
            read: (): boolean => true,
          },
          admin: {
            defaultColumns: ['from', 'to.type', 'createdAt'],
          },
          fields: [
            {
              name: 'from',
              index: true,
              label: 'From URL',
              required: true,
              type: 'text',
            },
            {
              name: 'to',
              fields: [
                {
                  name: 'type',
                  admin: {
                    layout: 'horizontal',
                  },
                  defaultValue: 'reference',
                  label: 'To URL Type',
                  options: [
                    {
                      label: 'Internal link',
                      value: 'reference',
                    },
                    {
                      label: 'Custom URL',
                      value: 'custom',
                    },
                  ],
                  type: 'radio',
                },
                {
                  name: 'reference',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'reference',
                  },
                  label: 'Document to redirect to',
                  relationTo: pluginConfig?.collections || [],
                  required: true,
                  type: 'relationship',
                },
                {
                  name: 'url',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'custom',
                  },
                  label: 'Custom URL',
                  required: true,
                  type: 'text',
                },
              ],
              label: false,
              type: 'group',
            },
          ],
          slug: 'redirects',
        },
        pluginConfig?.overrides || {},
      ),
    ],
  })

export default redirects
