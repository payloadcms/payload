import type { Config } from 'payload/config'

import type { PluginConfig } from './types.js'

import deepMerge from './deepMerge.js'

export const redirectsPlugin =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => ({
    ...incomingConfig,
    collections: [
      ...(incomingConfig?.collections || []),
      deepMerge(
        {
          slug: 'redirects',
          access: {
            read: (): boolean => true,
          },
          admin: {
            defaultColumns: ['from', 'to.type', 'createdAt'],
          },
          fields: [
            {
              name: 'from',
              type: 'text',
              index: true,
              label: 'From URL',
              required: true,
            },
            {
              name: 'to',
              type: 'group',
              fields: [
                {
                  name: 'type',
                  type: 'radio',
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
                },
                {
                  name: 'reference',
                  type: 'relationship',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'reference',
                  },
                  label: 'Document to redirect to',
                  relationTo: pluginConfig?.collections || [],
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'custom',
                  },
                  label: 'Custom URL',
                  required: true,
                },
              ],
              label: false,
            },
          ],
        },
        pluginConfig?.overrides || {},
      ),
    ],
  })
