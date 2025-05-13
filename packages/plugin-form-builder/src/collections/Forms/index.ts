import type { Block, CollectionConfig, Field } from 'payload'

import { deepMergeWithSourceArrays } from 'payload'

import type { FormBuilderPluginConfig } from '../../types.js'

import { fields } from './fields.js'

// all settings can be overridden by the config
export const generateFormCollection = (formConfig: FormBuilderPluginConfig): CollectionConfig => {
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
        label: 'URL to redirect to',
        required: true,
      },
    ],
  }

  if (formConfig.redirectRelationships) {
    redirect.fields.unshift({
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: 'Document to link to',
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
          label: 'Internal link',
          value: 'reference',
        },
        {
          label: 'Custom URL',
          value: 'custom',
        },
      ],
    })

    if (redirect.fields[2]!.type !== 'row') {
      redirect.fields[2]!.label = 'Custom URL'
    }

    redirect.fields[2]!.admin = {
      condition: (_, siblingData) => siblingData?.type === 'custom',
    }
  }

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
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
              return block(fieldConfig)
            }

            return block
          }

          return null
        })
        .filter(Boolean) as Block[],
    },
    {
      name: 'submitButtonLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'confirmationType',
      type: 'radio',
      admin: {
        description:
          'Choose whether to display an on-page message or redirect to a different page after they submit the form.',
        layout: 'horizontal',
      },
      defaultValue: 'message',
      options: [
        {
          label: 'Message',
          value: 'message',
        },
        {
          label: 'Redirect',
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
        description:
          "Send custom emails when the form submits. Use comma separated lists to send the same email to multiple recipients. To reference a value from this form, wrap that field's name with double curly brackets, i.e. {{firstName}}. You can use a wildcard {{*}} to output all data and {{*:table}} to format it as an HTML table in the email.",
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
              label: 'Email To',
            },
            {
              name: 'cc',
              type: 'text',
              admin: {
                style: {
                  maxWidth: '50%',
                },
              },
              label: 'CC',
            },
            {
              name: 'bcc',
              type: 'text',
              admin: {
                style: {
                  maxWidth: '50%',
                },
              },
              label: 'BCC',
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
              label: 'Reply To',
            },
            {
              name: 'emailFrom',
              type: 'text',
              admin: {
                placeholder: '"Email From" <email-from@email.com>',
                width: '50%',
              },
              label: 'Email From',
            },
          ],
        },
        {
          name: 'subject',
          type: 'text',
          defaultValue: "You've received a new message.",
          label: 'Subject',
          localized: true,
          required: true,
        },
        {
          name: 'message',
          type: 'richText',
          admin: {
            description: 'Enter the message that should be sent in this email.',
          },
          label: 'Message',
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
