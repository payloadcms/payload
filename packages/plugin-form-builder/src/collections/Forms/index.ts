import type { Block, CollectionConfig, Field } from 'payload/types'

import merge from 'deepmerge'

import type { FieldConfig, PluginConfig } from '../../types'

import { fields } from './fields'

// all settings can be overridden by the config
export const generateFormCollection = (formConfig: PluginConfig): CollectionConfig => {
  const redirect: Field = {
    name: 'redirect',
    admin: {
      condition: (_, siblingData) => siblingData?.confirmationType === 'redirect',
      hideGutter: true,
    },
    fields: [
      {
        name: 'url',
        label: 'URL to redirect to',
        required: true,
        type: 'text',
      },
    ],
    type: 'group',
  }

  if (formConfig.redirectRelationships) {
    redirect.fields.unshift({
      name: 'reference',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: 'Document to link to',
      maxDepth: 2,
      relationTo: formConfig.redirectRelationships,
      required: true,
      type: 'relationship',
    })

    redirect.fields.unshift({
      name: 'type',
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
      type: 'radio',
    })

    if (redirect.fields[2].type !== 'row') redirect.fields[2].label = 'Custom URL'

    redirect.fields[2].admin = {
      condition: (_, siblingData) => siblingData?.type === 'custom',
    }
  }

  const config: CollectionConfig = {
    ...(formConfig?.formOverrides || {}),
    access: {
      read: () => true,
      ...(formConfig?.formOverrides?.access || {}),
    },
    admin: {
      enableRichTextRelationship: false,
      useAsTitle: 'title',
      ...(formConfig?.formOverrides?.admin || {}),
    },
    fields: [
      {
        name: 'title',
        required: true,
        type: 'text',
        localized: true,
      },
      {
        name: 'fields',
        blocks: Object.entries(formConfig?.fields || {})
          .map(([fieldKey, fieldConfig]) => {
            // let the config enable/disable fields with either boolean values or objects
            if (fieldConfig !== false) {
              const block = fields[fieldKey]

              if (block === undefined && typeof fieldConfig === 'object') {
                return fieldConfig
              }

              if (typeof block === 'object' && typeof fieldConfig === 'object') {
                return merge<FieldConfig>(block, fieldConfig, {
                  arrayMerge: (_, sourceArray) => sourceArray,
                })
              }

              if (typeof block === 'function') {
                return block(fieldConfig)
              }

              return block
            }

            return null
          })
          .filter(Boolean) as Block[],
        type: 'blocks',
      },
      {
        name: 'submitButtonLabel',
        localized: true,
        type: 'text',
      },
      {
        name: 'confirmationType',
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
        type: 'radio',
      },
      {
        name: 'confirmationMessage',
        admin: {
          condition: (_, siblingData) => siblingData?.confirmationType === 'message',
        },
        localized: true,
        required: true,
        type: 'richText',
      },
      redirect,
      {
        name: 'emails',
        admin: {
          description:
            "Send custom emails when the form submits. Use comma separated lists to send the same email to multiple recipients. To reference a value from this form, wrap that field's name with double curly brackets, i.e. {{firstName}}.",
        },
        fields: [
          {
            fields: [
              {
                name: 'emailTo',
                admin: {
                  placeholder: '"Email Sender" <sender@email.com>',
                  width: '100%',
                },
                label: 'Email To',
                type: 'text',
              },
              {
                name: 'cc',
                admin: {
                  width: '50%',
                },
                label: 'CC',
                type: 'text',
              },
              {
                name: 'bcc',
                admin: {
                  width: '50%',
                },
                label: 'BCC',
                type: 'text',
              },
            ],
            type: 'row',
          },
          {
            fields: [
              {
                name: 'replyTo',
                admin: {
                  placeholder: '"Reply To" <reply-to@email.com>',
                  width: '50%',
                },
                label: 'Reply To',
                type: 'text',
              },
              {
                name: 'emailFrom',
                admin: {
                  placeholder: '"Email From" <email-from@email.com>',
                  width: '50%',
                },
                label: 'Email From',
                type: 'text',
              },
            ],
            type: 'row',
          },
          {
            name: 'subject',
            defaultValue: "You've received a new message.",
            label: 'Subject',
            localized: true,
            required: true,
            type: 'text',
          },
          {
            name: 'message',
            admin: {
              description: 'Enter the message that should be sent in this email.',
            },
            label: 'Message',
            localized: true,
            type: 'richText',
          },
        ],
        type: 'array',
      },
      ...(formConfig?.formOverrides?.fields || []),
    ],
    slug: formConfig?.formOverrides?.slug || 'forms',
  }

  return config
}
