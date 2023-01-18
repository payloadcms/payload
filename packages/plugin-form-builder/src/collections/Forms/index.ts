import { Block, CollectionConfig, Field } from 'payload/types';
import merge from 'deepmerge';
import { FieldConfig, PluginConfig } from '../../types';
import fields from './fields';

// all settings can be overridden by the config
export const generateFormCollection = (formConfig: PluginConfig): CollectionConfig => {

  const redirect: Field = {
    name: 'redirect',
    type: 'group',
    admin: {
      hideGutter: true,
      condition: (_, siblingData) => siblingData?.confirmationType === 'redirect',
    },
    fields: [
      {
        name: 'url',
        label: 'URL to redirect to',
        type: 'text',
        required: true,
      },
    ],
  };

  if (formConfig.redirectRelationships) {
    redirect.fields.unshift({
      name: 'reference',
      label: 'Document to link to',
      type: 'relationship',
      relationTo: formConfig.redirectRelationships,
      required: true,
      maxDepth: 2,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
    });

    redirect.fields.unshift({
      name: 'type',
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
    });

    if (redirect.fields[2].type !== 'row') redirect.fields[2].label = 'Custom URL';

    redirect.fields[2].admin = {
      condition: (_, siblingData) => siblingData?.type === 'custom',
    };
  }

  const config: CollectionConfig = {
    slug: formConfig?.formOverrides?.slug || 'forms',
    admin: {
      useAsTitle: 'title',
      enableRichTextRelationship: false,
      ...formConfig?.formOverrides?.admin || {},
    },
    access: {
      read: () => true,
      ...formConfig?.formOverrides?.access || {}
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
      },
      {
        name: 'fields',
        type: 'blocks',
        blocks: Object.entries(formConfig?.fields || {}).map(([fieldKey, fieldConfig]) => {
          // let the config enable/disable fields with either boolean values or objects
          if (fieldConfig !== false) {
            let block = fields[fieldKey];

            if (block === undefined && typeof fieldConfig === 'object') {
              return fieldConfig
            }

            if (typeof block === 'object' && typeof fieldConfig === 'object') {
              return merge<FieldConfig>(block, fieldConfig, {
                arrayMerge: (_, sourceArray) => sourceArray
              });
            }

            if (typeof block === 'function') {
              return block(fieldConfig);
            }

            return block;
          }

          return null;
        }).filter(Boolean) as Block[],
      },
      {
        name: 'submitButtonLabel',
        type: 'text',
      },
      {
        name: 'confirmationType',
        type: 'radio',
        admin: {
          description: 'Choose whether to display an on-page message or redirect to a different page after they submit the form.',
          layout: 'horizontal',
        },
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
        defaultValue: 'message',
      },
      {
        name: 'confirmationMessage',
        type: 'richText',
        required: true,
        admin: {
          condition: (_, siblingData) => siblingData?.confirmationType === 'message',
        },
      },
      redirect,
      {
        name: 'emails',
        type: 'array',
        admin: {
          description: 'Send custom emails when the form submits. Use comma separated lists to send the same email to multiple recipients. To reference a value from this form, wrap that field\'s name with double curly brackets, i.e. {{firstName}}.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                type: 'text',
                name: 'emailTo',
                label: 'Email To',
                required: true,
                admin: {
                  width: '100%',
                  placeholder: '"Email Sender" <sender@email.com>'
                },
              },
              {
                type: 'text',
                name: 'cc',
                label: 'CC',
                admin: {
                  width: '50%',
                },
              },
              {
                type: 'text',
                name: 'bcc',
                label: 'BCC',
                admin: {
                  width: '50%',
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                type: 'text',
                name: 'replyTo',
                label: 'Reply To',
                admin: {
                  width: '50%',
                  placeholder: '"Reply To" <reply-to@email.com>',
                },
              },
              {
                type: 'text',
                name: 'emailFrom',
                label: 'Email From',
                admin: {
                  width: '50%',
                  placeholder: '"Email From" <email-from@email.com>',
                },
              },
            ],
          },
          {
            type: 'text',
            name: 'subject',
            label: 'Subject',
            defaultValue: 'You\'ve received a new message.',
            required: true,
          },
          {
            type: 'richText',
            name: 'message',
            label: 'Message',
            admin: {
              description: 'Enter the message that should be sent in this email.',
            },
          },
        ],
      },
      ...formConfig?.formOverrides?.fields || []
    ],
  }

  return config;
};
