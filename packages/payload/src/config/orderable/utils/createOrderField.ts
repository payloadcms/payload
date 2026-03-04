import type { Field } from '../../../fields/config/types.js'

/**
 * Creates an internal read-only order field used by orderable collections.
 */
export function createOrderField(orderableFieldName: string): Field {
  return {
    name: orderableFieldName,
    type: 'text',
    admin: {
      disableBulkEdit: true,
      disabled: true,
      disableGroupBy: true,
      disableListColumn: true,
      disableListFilter: true,
      hidden: true,
      readOnly: true,
    },
    hooks: {
      beforeDuplicate: [
        ({ siblingData }) => {
          delete siblingData[orderableFieldName]
        },
      ],
    },
    index: true,
  }
}
