import type { Block, CollectionConfig, Config, Field } from 'payload'

import { deepMergeWithSourceArrays } from 'payload'

import type { FormBuilderPluginConfig } from '../../types.js'

import { fields } from './fields.js'

const applyUploadCollectionLabels = (args: {
  block: Block
  collections: Config['collections']
  uploadCollections: FormBuilderPluginConfig['uploadCollections']
}): Block => {
  const { block, collections, uploadCollections } = args
  const collectionsBySlug = new Map(
    (collections || []).map((collection) => [collection.slug, collection]),
  )

  for (const field of block.fields) {
    if ('name' in field && field.name === 'uploadCollection' && field.type === 'select') {
      // Replace the default slug labels with the source collection's labels.singular.
      // Select option labels accept strings, locale records and label functions —
      // Payload's admin resolves them at render time via getTranslation.
      field.options = (uploadCollections || []).map((slug) => {
        const singular = collectionsBySlug.get(slug)?.labels?.singular
        return { label: singular ?? slug, value: slug }
      })
      break
    }
  }

  return block
}

// all settings can be overridden by the config
export const generateFormCollection = (
  formConfig: FormBuilderPluginConfig,
  collections?: Config['collections'],
): CollectionConfig => {
  const redirect: Field = {
    name: 'redirect',
    type: 'group',
    admin: {
      condition: (_, siblingData) => siblingData?.confirmationType === 'redirect',
      hideGutter: true,
    },
    fields: [
      {
        name: 'url',
        type: 'text',
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:urlToRedirectTo'),
        required: true,
      },
    ],
    label: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:redirect'),
  }

  if (formConfig.redirectRelationships) {
    redirect.fields.unshift({
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:documentToLinkTo'),
      maxDepth: 2,
      relationTo: formConfig.redirectRelationships,
      required: true,
    })

    redirect.fields.unshift({
      name: 'type',
      type: 'radio',
      admin: {
        layout: 'horizontal',
      },
      defaultValue: 'reference',
      options: [
        {
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:internalLink'),
          value: 'reference',
        },
        {
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:customURL'),
          value: 'custom',
        },
      ],
    })

    if (redirect.fields[2]!.type !== 'row') {
      redirect.fields[2]!.label = ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:customURL')
    }

    redirect.fields[2]!.admin = {
      condition: (_, siblingData) => siblingData?.type === 'custom',
    }
  }

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:title'),
      required: true,
    },
    {
      name: 'fields',
      type: 'blocks',
      blocks: Object.entries(formConfig?.fields || {})
        .map(([fieldKey, fieldConfig]) => {
          // let the config enable/disable fields with either boolean values or objects
          if (fieldConfig !== false) {
            const block = fields[fieldKey]

            if (block === undefined && typeof fieldConfig === 'object') {
              return fieldConfig
            }

            if (typeof block === 'object' && typeof fieldConfig === 'object') {
              return deepMergeWithSourceArrays(block, fieldConfig)
            }

            if (typeof block === 'function') {
              // Special handling for upload field - factory takes slug list; after it runs,
              // inject resolved collection labels into the uploadCollection select.
              if (fieldKey === 'upload') {
                return applyUploadCollectionLabels({
                  block: block(formConfig.uploadCollections || []),
                  collections,
                  uploadCollections: formConfig.uploadCollections,
                })
              }
              return block(fieldConfig)
            }

            return block
          }

          return null
        })
        .filter(Boolean) as Block[],
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:fields'),
      labels: {
        plural: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:fields'),
        singular: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:field'),
      },
    },
    {
      name: 'submitButtonLabel',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:submitButton'),
      localized: true,
    },
    {
      name: 'confirmationType',
      type: 'radio',
      admin: {
        description: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:chooseConfirmationType'),
        layout: 'horizontal',
      },
      defaultValue: 'message',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:confirmationType'),
      options: [
        {
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:message'),
          value: 'message',
        },
        {
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:redirect'),
          value: 'redirect',
        },
      ],
    },
    {
      name: 'confirmationMessage',
      type: 'richText',
      admin: {
        condition: (_, siblingData) => siblingData?.confirmationType === 'message',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:confirmationMessage'),
      localized: true,
      required: true,
    },
    redirect,
    {
      name: 'emails',
      type: 'array',
      access: {
        read: ({ req: { user } }) => !!user,
      },
      admin: {
        description: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:emailsDescription'),
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'emailTo',
              type: 'text',
              admin: {
                placeholder: '"Email Sender" <sender@email.com>',
                width: '100%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:emailTo'),
            },
            {
              name: 'cc',
              type: 'text',
              admin: {
                style: {
                  maxWidth: '50%',
                },
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:cc'),
            },
            {
              name: 'bcc',
              type: 'text',
              admin: {
                style: {
                  maxWidth: '50%',
                },
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:bcc'),
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'replyTo',
              type: 'text',
              admin: {
                placeholder: '"Reply To" <reply-to@email.com>',
                width: '50%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:replyTo'),
            },
            {
              name: 'emailFrom',
              type: 'text',
              admin: {
                placeholder: '"Email From" <email-from@email.com>',
                width: '50%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:emailFrom'),
            },
          ],
        },
        {
          name: 'subject',
          type: 'text',
          defaultValue: "You've received a new message.",
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:subject'),
          localized: true,
          required: true,
        },
        {
          name: 'message',
          type: 'richText',
          admin: {
            description: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:messageDescription'),
          },
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:message'),
          localized: true,
        },
      ],
    },
  ]

  const config: CollectionConfig = {
    ...(formConfig?.formOverrides || {}),
    slug: formConfig?.formOverrides?.slug || 'forms',
    access: {
      read: () => true,
      ...(formConfig?.formOverrides?.access || {}),
    },
    admin: {
      enableRichTextRelationship: false,
      useAsTitle: 'title',
      ...(formConfig?.formOverrides?.admin || {}),
    },
    fields:
      formConfig?.formOverrides?.fields && typeof formConfig?.formOverrides?.fields === 'function'
        ? formConfig.formOverrides.fields({ defaultFields })
        : defaultFields,
  }

  return config
}
