import type { CollectionConfig } from 'payload'

const validateFieldTransformAction = (hook: string, value) => {
  if (value !== undefined && value !== null && !Array.isArray(value)) {
    console.error(hook, value)
    throw new Error(
      'Field transformAction should convert value to array [x, y] and not { coordinates: [x, y] }',
    )
  }
  return value
}
export const transformSlug = 'transforms'
const TransformHooks: CollectionConfig = {
  slug: transformSlug,
  access: {
    read: () => true,
    create: () => true,
    delete: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'transform',
      type: 'point',
      hooks: {
        beforeValidate: [({ value }) => validateFieldTransformAction('beforeValidate', value)],
        beforeChange: [({ value }) => validateFieldTransformAction('beforeChange', value)],
        afterChange: [({ value }) => validateFieldTransformAction('afterChange', value)],
        afterRead: [({ value }) => validateFieldTransformAction('afterRead', value)],
      },
    },
    {
      name: 'localizedTransform',
      type: 'point',
      localized: true,
      hooks: {
        beforeValidate: [({ value }) => validateFieldTransformAction('beforeValidate', value)],
        beforeChange: [({ value }) => validateFieldTransformAction('beforeChange', value)],
        afterChange: [({ value }) => validateFieldTransformAction('afterChange', value)],
        afterRead: [({ value }) => validateFieldTransformAction('afterRead', value)],
      },
    },
  ],
  hooks: {
    beforeRead: [(operation) => operation.doc],
    beforeChange: [
      (operation) => {
        operation.data.beforeChange = !operation.data.location?.coordinates
        return operation.data
      },
    ],
    afterRead: [
      (operation) => {
        const { doc } = operation
        doc.afterReadHook = !doc.location?.coordinates
        return doc
      },
    ],
    afterChange: [
      (operation) => {
        const { doc } = operation
        doc.afterChangeHook = !doc.location?.coordinates
        return doc
      },
    ],
    afterDelete: [
      (operation) => {
        const { doc } = operation
        operation.doc.afterDeleteHook = !doc.location?.coordinates
        return doc
      },
    ],
  },
}

export default TransformHooks
