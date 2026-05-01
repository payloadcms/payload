import type { CollectionConfig } from 'payload'

import { rowFieldsSlug } from '../../slugs.js'

const RowFields: CollectionConfig = {
  slug: rowFieldsSlug,
  fields: [
    // Basic 50/50 split
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          admin: { width: '50%' },
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Last Name',
          admin: { width: '50%' },
        },
      ],
    },
    // Three column layout
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          label: 'City',
          admin: { width: '50%' },
        },
        {
          name: 'state',
          type: 'text',
          label: 'State',
          admin: { width: '25%' },
        },
        {
          name: 'zip',
          type: 'text',
          label: 'Zip',
          admin: { width: '25%' },
        },
      ],
    },
    // Mixed field types
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          admin: { width: '50%' },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Phone',
          admin: { width: '25%' },
        },
        {
          name: 'newsletter',
          type: 'checkbox',
          label: 'Subscribe to newsletter',
          admin: { width: '25%' },
        },
      ],
    },
    // Select and number in row
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
            { label: 'Option C', value: 'c' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'quantity',
          type: 'number',
          label: 'Quantity',
          admin: { width: '50%' },
        },
      ],
    },
    // Auto width (no explicit width set)
    {
      type: 'row',
      fields: [
        {
          name: 'autoWidthA',
          type: 'text',
          label: 'Auto Width A',
        },
        {
          name: 'autoWidthB',
          type: 'text',
          label: 'Auto Width B',
        },
      ],
    },
    // Mixed explicit and auto widths
    {
      type: 'row',
      fields: [
        {
          name: 'explicit30',
          type: 'text',
          label: '30% Width',
          admin: { width: '30%' },
        },
        {
          name: 'autoFill',
          type: 'text',
          label: 'Auto Fill Remaining',
        },
      ],
    },
    // Four equal columns
    {
      type: 'row',
      fields: [
        {
          name: 'q1',
          type: 'text',
          label: 'Q1',
          admin: { width: '25%' },
        },
        {
          name: 'q2',
          type: 'text',
          label: 'Q2',
          admin: { width: '25%' },
        },
        {
          name: 'q3',
          type: 'text',
          label: 'Q3',
          admin: { width: '25%' },
        },
        {
          name: 'q4',
          type: 'text',
          label: 'Q4',
          admin: { width: '25%' },
        },
      ],
    },
    // Collapsibles in a row
    {
      type: 'row',
      fields: [
        {
          type: 'collapsible',
          label: 'Billing Address',
          admin: { width: '50%' },
          fields: [
            { name: 'billingStreet', type: 'text', label: 'Street' },
            { name: 'billingCity', type: 'text', label: 'City' },
          ],
        },
        {
          type: 'collapsible',
          label: 'Shipping Address',
          admin: { width: '50%' },
          fields: [
            { name: 'shippingStreet', type: 'text', label: 'Street' },
            { name: 'shippingCity', type: 'text', label: 'City' },
          ],
        },
      ],
    },
  ],
}

export default RowFields
