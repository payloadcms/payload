import type { CollectionConfig, Config, Field, SelectField } from 'payload'

import type { RedirectsPluginConfig } from './types.js'

import { redirectOptions } from './redirectTypes.js'

export { redirectOptions, redirectTypes } from './redirectTypes.js'
export const redirectsPlugin =
  (pluginConfig: RedirectsPluginConfig) =>
  (incomingConfig: Config): Config => {
    const redirectSelectField: SelectField = {
      name: 'type',
      type: 'select',
      label: 'Redirect Type',
      options: redirectOptions.filter((option) =>
        pluginConfig?.redirectTypes?.includes(option.value),
      ),
      required: true,
      ...((pluginConfig?.redirectTypeFieldOverride || {}) as {
        hasMany: boolean
      } & Partial<SelectField>),
    }

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
      ...(pluginConfig?.redirectTypes ? [redirectSelectField] : []),
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
