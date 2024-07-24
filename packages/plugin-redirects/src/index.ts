import type { CollectionConfig, Config, Field } from 'payload'

import type { RedirectsPluginConfig } from './types.js'

export const redirectsPlugin =
  (pluginConfig: RedirectsPluginConfig) =>
  (incomingConfig: Config): Config => {
    const defaultFields: Field[] = [
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
    ]

    const redirectsCollection: CollectionConfig = {
      ...(pluginConfig?.overrides || {}),
      slug: pluginConfig?.overrides?.slug || 'redirects',
      access: {
        read: () => true,
        ...(pluginConfig?.overrides?.access || {}),
      },
      admin: {
        defaultColumns: ['from', 'to.type', 'createdAt'],
        ...(pluginConfig?.overrides?.admin || {}),
      },
      fields:
        pluginConfig?.overrides?.fields && typeof pluginConfig?.overrides?.fields === 'function'
          ? pluginConfig?.overrides.fields({ defaultFields })
          : defaultFields,
    }

    return {
      ...incomingConfig,
      collections: [...(incomingConfig?.collections || []), redirectsCollection],
    }
  }
