import type { CollectionConfig, Config, Field, SelectField } from '@ruya.sa/payload'

import { deepMergeSimple } from '@ruya.sa/payload/shared'

import type { RedirectsPluginConfig } from './types.js'

import { redirectOptions } from './redirectTypes.js'
import { translations } from './translations/index.js'

export { redirectOptions, redirectTypes } from './redirectTypes.js'
export { translations as redirectsTranslations } from './translations/index.js'
export const redirectsPlugin =
  (pluginConfig: RedirectsPluginConfig) =>
  (incomingConfig: Config): Config => {
    // Merge translations FIRST (before building fields)
    if (!incomingConfig.i18n) {
      incomingConfig.i18n = {}
    }

    if (!incomingConfig.i18n?.translations) {
      incomingConfig.i18n.translations = {}
    }

    incomingConfig.i18n.translations = deepMergeSimple(
      translations,
      incomingConfig.i18n?.translations,
    )

    const redirectSelectField: SelectField = {
      name: 'type',
      type: 'select',
      // @ts-expect-error - translations are not typed in plugins yet
      label: ({ t }) => t('plugin-redirects:redirectType'),
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
        // @ts-expect-error - translations are not typed in plugins yet
        label: ({ t }) => t('plugin-redirects:fromUrl'),
        required: true,
        unique: true,
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
            // @ts-expect-error - translations are not typed in plugins yet
            label: ({ t }) => t('plugin-redirects:toUrlType'),
            options: [
              {
                // @ts-expect-error - translations are not typed in plugins yet
                label: ({ t }) => t('plugin-redirects:internalLink'),
                value: 'reference',
              },
              {
                // @ts-expect-error - translations are not typed in plugins yet
                label: ({ t }) => t('plugin-redirects:customUrl'),
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
            // @ts-expect-error - translations are not typed in plugins yet
            label: ({ t }) => t('plugin-redirects:documentToRedirect'),
            relationTo: pluginConfig?.collections || [],
            required: true,
          },
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_, siblingData) => siblingData?.type === 'custom',
            },
            // @ts-expect-error - translations are not typed in plugins yet
            label: ({ t }) => t('plugin-redirects:customUrl'),
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
