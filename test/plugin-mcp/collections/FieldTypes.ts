import type { CollectionConfig } from 'payload'

export const fieldTypesSlug = 'field-types'

export const FieldTypes: CollectionConfig = {
  slug: fieldTypesSlug,
  fields: [
    // Atomic data fields
    {
      name: 'textField',
      type: 'text',
      admin: {
        description: 'A simple text field',
      },
    },
    {
      name: 'textareaField',
      type: 'textarea',
      admin: {
        description: 'A textarea field',
      },
    },
    {
      name: 'numberField',
      type: 'number',
      admin: {
        description: 'A number field',
      },
    },
    {
      name: 'emailField',
      type: 'email',
      admin: {
        description: 'An email field',
      },
    },
    {
      name: 'checkboxField',
      type: 'checkbox',
      admin: {
        description: 'A checkbox field',
      },
    },
    {
      name: 'dateField',
      type: 'date',
      admin: {
        description: 'A date field',
      },
    },
    {
      name: 'codeField',
      type: 'code',
      admin: {
        description: 'A code field',
      },
    },
    {
      name: 'jsonField',
      type: 'json',
      admin: {
        description: 'A JSON field',
      },
    },
    {
      name: 'selectField',
      type: 'select',
      admin: {
        description: 'A select field',
      },
      options: [
        { label: 'Option One', value: 'option1' },
        { label: 'Option Two', value: 'option2' },
        { label: 'Option Three', value: 'option3' },
      ],
    },
    {
      name: 'radioField',
      type: 'radio',
      admin: {
        description: 'A radio field',
      },
      options: [
        { label: 'Radio One', value: 'radio1' },
        { label: 'Radio Two', value: 'radio2' },
        { label: 'Radio Three', value: 'radio3' },
      ],
    },

    // Array field
    {
      name: 'arrayField',
      type: 'array',
      admin: {
        description: 'An array field with nested items',
      },
      fields: [
        {
          name: 'item',
          type: 'text',
        },
        {
          name: 'itemNumber',
          type: 'number',
        },
      ],
    },

    // Group field (stored as nested object)
    {
      name: 'groupField',
      type: 'group',
      admin: {
        description: 'A group field with nested properties',
      },
      fields: [
        {
          name: 'groupText',
          type: 'text',
        },
        {
          name: 'groupNumber',
          type: 'number',
        },
      ],
    },

    // Upload field
    {
      name: 'uploadField',
      type: 'upload',
      admin: {
        description: 'An upload field',
      },
      relationTo: 'media',
    },

    // UI field (display-only, not stored, should be absent from create/update schema)
    {
      name: 'uiField',
      type: 'ui',
      admin: {
        components: {},
      },
    },

    // Collapsible layout field (children are flattened to top level in the document)
    {
      type: 'collapsible',
      label: 'Collapsible Section',
      fields: [
        {
          name: 'collapsibleText',
          type: 'text',
          admin: {
            description: 'Text field inside a collapsible container',
          },
        },
      ],
    },

    // Row layout field (children are flattened to top level in the document)
    {
      type: 'row',
      fields: [
        {
          name: 'rowText',
          type: 'text',
          admin: {
            description: 'Text field inside a row container',
          },
        },
      ],
    },

    // Tabs field with both named and unnamed tabs
    {
      type: 'tabs',
      tabs: [
        // Named tab - stored as a nested object at `namedTab.namedTabText`
        {
          name: 'namedTab',
          label: 'Named Tab',
          fields: [
            {
              name: 'namedTabText',
              type: 'text',
              admin: {
                description: 'Text field inside a named tab',
              },
            },
          ],
        },
        // Unnamed tab - children are flattened to the top level of the document
        {
          label: 'Unnamed Tab',
          fields: [
            {
              name: 'unnamedTabText',
              type: 'text',
              admin: {
                description: 'Text field inside an unnamed tab',
              },
            },
          ],
        },
      ],
    },
  ],
}
