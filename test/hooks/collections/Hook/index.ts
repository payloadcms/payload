import type { CollectionConfig } from 'payload'

export const hooksSlug = 'hooks'
const Hooks: CollectionConfig = {
  slug: hooksSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  hooks: {
    beforeOperation: [
      ({ operation, req }) => {
        if (
          typeof req.payload.db.beginTransaction === 'function' &&
          !req.transactionID &&
          ['create', 'delete', 'update'].includes(operation)
        ) {
          throw new Error('transactionID is missing in beforeOperation hook')
        }
      },
    ],
    beforeValidate: [({ data }) => validateHookOrder('collectionBeforeValidate', data)],
    beforeChange: [({ data }) => validateHookOrder('collectionBeforeChange', data)],
    afterChange: [
      ({ doc, previousDoc }) => {
        if (!previousDoc) {
          throw new Error('previousDoc is missing in afterChange hook')
        }
        return validateHookOrder('collectionAfterChange', doc)
      },
    ],
    beforeRead: [({ doc }) => validateHookOrder('collectionBeforeRead', doc)],
    afterRead: [({ doc }) => validateHookOrder('collectionAfterRead', doc)],
  },
  fields: [
    {
      name: 'fieldBeforeValidate',
      type: 'checkbox',
      hooks: {
        beforeValidate: [
          ({ data }) => {
            data.fieldBeforeValidate = true
            validateHookOrder('fieldBeforeValidate', data)
            return true
          },
        ],
      },
    },
    {
      name: 'fieldBeforeChange',
      type: 'checkbox',
      hooks: {
        beforeChange: [
          ({ data, operation, previousSiblingDoc, previousValue }) => {
            if (operation === 'update') {
              if (typeof previousValue === 'undefined') {
                throw new Error('previousValue is missing in beforeChange hook')
              }
              if (!previousSiblingDoc) {
                throw new Error('previousSiblingDoc is missing in beforeChange hook')
              }
            }
            data.fieldBeforeChange = true
            validateHookOrder('fieldBeforeChange', data)
            return true
          },
        ],
      },
    },
    {
      name: 'fieldAfterChange',
      type: 'checkbox',
      hooks: {
        afterChange: [
          ({ data, previousDoc, previousSiblingDoc }) => {
            data.fieldAfterChange = true
            if (!previousDoc) {
              throw new Error('previousDoc is missing in afterChange hook')
            }
            if (!previousSiblingDoc) {
              throw new Error('previousSiblingDoc is missing in afterChange hook')
            }
            validateHookOrder('fieldAfterChange', data)
            return true
          },
        ],
      },
    },
    {
      name: 'fieldAfterRead',
      type: 'checkbox',
      hooks: {
        afterRead: [
          ({ data }) => {
            data.fieldAfterRead = true
            validateHookOrder('fieldAfterRead', data)
            return true
          },
        ],
      },
    },
    {
      name: 'collectionBeforeValidate',
      type: 'checkbox',
    },
    {
      name: 'collectionBeforeChange',
      type: 'checkbox',
    },
    {
      name: 'collectionAfterChange',
      type: 'checkbox',
    },
    {
      name: 'collectionBeforeRead',
      type: 'checkbox',
    },
    {
      name: 'collectionAfterRead',
      type: 'checkbox',
    },
  ],
}

const writeHooksOrder = [
  'fieldBeforeValidate',
  'collectionBeforeValidate',
  'collectionBeforeChange',
  'fieldBeforeChange',
  'fieldAfterRead',
  'collectionAfterRead',
  'fieldAfterChange',
  'collectionAfterChange',
]

const validateHookOrder = (check: string, data) => {
  let hasMatched
  if (check === 'collectionBeforeRead') {
    data.collectionBeforeRead = true
  }
  writeHooksOrder.forEach((hook) => {
    if (hook === check) {
      data[check] = true
      hasMatched = true
    } else if ((!hasMatched && !data[hook]) || (hasMatched && data[hook])) {
      // throw new Error(`${check} called before ${hook}`);
    }
  })
  return data
}

export default Hooks
