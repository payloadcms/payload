import type { Field } from 'payload'

export const defaultAddressFields: () => Field[] = () => {
  return [
    {
      name: 'title',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressTitle'),
    },
    {
      name: 'firstName',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressFirstName'),
    },
    {
      name: 'lastName',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressLastName'),
    },
    {
      name: 'company',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressCompany'),
    },
    {
      name: 'addressLine1',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressLine1'),
    },
    {
      name: 'addressLine2',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressLine2'),
    },
    {
      name: 'city',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressCity'),
    },
    {
      name: 'state',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressState'),
    },
    {
      name: 'postalCode',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressPostalCode'),
    },
    {
      name: 'country',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressCountry'),
    },
    {
      name: 'phone',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:addressPhone'),
    },
  ]
}
