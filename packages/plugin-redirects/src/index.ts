import type { Config } from 'payload/config'

import deepMerge from './deepMerge'
import type { PluginConfig } from './types'

const redirects =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => ({
    ...incomingConfig,
    collections: [
      ...(incomingConfig?.collections || []),
      deepMerge(
        {
          slug: 'redirects',
          admin: {
            defaultColumns: ['from', 'to.type', 'createdAt'],
          },
          access: {
            read: (): boolean => true,
          },
          fields: [
            {
              name: 'from',
              label: 'From URL',
              index: true,
              required: true,
              type: 'text',
            },
            {
              name: 'to',
              label: false,
              type: 'group',
              fields: [
                {
                  name: 'type',
                  label: 'To URL Type',
                  type: 'radio',
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
                  defaultValue: 'reference',
                  admin: {
                    layout: 'horizontal',
                  },
                },
                {
                  name: 'reference',
                  label: 'Document to redirect to',
                  type: 'relationship',
                  relationTo: pluginConfig?.collections || [],
                  required: true,
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'reference',
                  },
                },
                {
                  name: 'url',
                  label: 'Custom URL',
                  type: 'text',
                  required: true,
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'custom',
                  },
                },
              ],
            },
          ],
        },
        pluginConfig?.overrides || {},
      ),
    ],
  })

export default redirects
