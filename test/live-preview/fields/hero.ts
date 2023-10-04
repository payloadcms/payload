import type { Field } from '../../../packages/payload/src/fields/config/types'

// import linkGroup from './linkGroup'
// import richText from './richText'
// import label from './richText/label'
// import largeBody from './richText/largeBody'

export const hero: Field = {
  name: 'hero',
  label: false,
  type: 'group',
  fields: [
    {
      type: 'select',
      name: 'type',
      label: 'Type',
      required: true,
      defaultValue: 'lowImpact',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
      ],
    },
    {
      name: 'richText',
      type: 'richText',
      required: true,
    },
    // linkGroup({
    //   overrides: {
    //     maxRows: 2,
    //   },
    // }),
    // {
    //   name: 'media',
    //   type: 'upload',
    //   relationTo: 'media',
    //   required: true,
    //   admin: {
    //     condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
    //   },
    // },
  ],
}
