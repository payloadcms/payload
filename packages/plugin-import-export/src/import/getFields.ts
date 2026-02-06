import type { Field, PayloadRequest } from 'payload'

type GetFieldsOptions = {
  /**
   * Collection slugs that this import collection supports.
   * Used for schema/types and as the options in the select field.
   */
  collectionSlugs: string[]
}

export const getFields = (options: GetFieldsOptions): Field[] => {
  const { collectionSlugs } = options

  return [
    {
      name: 'collectionSlug',
      type: 'text',
      admin: {
        components: {
          Field: '@payloadcms/plugin-import-export/rsc#ImportCollectionField',
        },
      },
      defaultValue: collectionSlugs[0],
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:field-collectionSlug-label'),
      required: true,
      validate: (value: null | string | undefined, { req }: { req: PayloadRequest }) => {
        if (!value) {
          return 'Collection is required'
        }
        // Validate that the collection exists
        const collectionExists = req?.payload?.collections?.[value]
        if (!collectionExists) {
          return `Collection "${value}" does not exist`
        }
        return true
      },
    },
    {
      name: 'importMode',
      type: 'select',
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:field-importMode-label'),
      options: [
        {
          // @ts-expect-error - this is not correctly typed in plugins right now
          label: ({ t }) => t('plugin-import-export:field-importMode-create-label'),
          value: 'create',
        },
        {
          // @ts-expect-error - this is not correctly typed in plugins right now
          label: ({ t }) => t('plugin-import-export:field-importMode-update-label'),
          value: 'update',
        },
        {
          // @ts-expect-error - this is not correctly typed in plugins right now
          label: ({ t }) => t('plugin-import-export:field-importMode-upsert-label'),
          value: 'upsert',
        },
      ],
    },
    {
      name: 'matchField',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.importMode !== 'create',
        // @ts-expect-error - this is not correctly typed in plugins right now
        description: ({ t }) => t('plugin-import-export:field-matchField-description'),
      },
      defaultValue: 'id',
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:field-matchField-label'),
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        readOnly: true,
      },
      defaultValue: 'pending',
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:field-status-label'),
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Partial',
          value: 'partial',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
    },
    {
      name: 'summary',
      type: 'group',
      admin: {
        condition: (data) =>
          data?.status === 'completed' || data?.status === 'partial' || data?.status === 'failed',
      },
      fields: [
        {
          name: 'imported',
          type: 'number',
          admin: {
            readOnly: true,
          },
          label: 'Imported',
        },
        {
          name: 'updated',
          type: 'number',
          admin: {
            readOnly: true,
          },
          label: 'Updated',
        },
        {
          name: 'total',
          type: 'number',
          admin: {
            readOnly: true,
          },
          label: 'Total',
        },
        {
          name: 'issues',
          type: 'number',
          admin: {
            readOnly: true,
          },
          label: 'Issues',
        },
        {
          name: 'issueDetails',
          type: 'json',
          admin: {
            condition: (_, siblingData) => siblingData?.issues > 0,
            readOnly: true,
          },
          label: 'Issue Details',
        },
      ],
      // @ts-expect-error - this is not correctly typed in plugins right now
      label: ({ t }) => t('plugin-import-export:field-summary-label'),
    },
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '@payloadcms/plugin-import-export/rsc#ImportPreview',
        },
      },
    },
  ]
}
