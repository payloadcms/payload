import type { Field } from '../config/types.js'

/**
 * This field is never used directly.
 * The field type is `text` just so the column appears.
 *
 * It adds a custom cell component to display the status for all locales in the admin list view.
 * The component queries the versions table for the `localeStatus` field on the latest version.
 */
export const baseAllLocaleStatusField: Field[] = [
  {
    name: '_localeStatusCell',
    type: 'text',
    admin: {
      components: {
        Cell: '@payloadcms/ui/rsc#AllLocaleStatusCell',
      },
      disableListFilter: true,
      hidden: true,
    },
    label: ({ t }) => t('fields:allLocaleStatus'),
  },
]
