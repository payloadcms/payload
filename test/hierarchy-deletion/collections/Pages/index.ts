import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  access: {
    create: () => true,
    delete: ({ id, req }) =>
      req.context.denyPageDeletes !== true &&
      (req.context.denyDeleteID === undefined || id !== req.context.denyDeleteID),
    read: () => true,
    update: ({ data, req }) =>
      req.context.denyPageUpdates !== true &&
      !(
        req.context.denyCollectionParentTarget !== undefined &&
        data?.parent === req.context.denyCollectionParentTarget
      ),
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'parent',
      type: 'relationship',
      access: {
        update: ({ data, req }) =>
          req.context.denyParentUpdates !== true &&
          !(
            req.context.denyFieldParentTarget !== undefined &&
            data?.parent === req.context.denyFieldParentTarget
          ),
      },
      hasMany: false,
      relationTo: pagesSlug,
    },
  ],
  hierarchy: { parentFieldName: 'parent' },
  hooks: {
    afterChange: [
      ({ doc, previousDoc, req }) => {
        const events = req.context.hierarchyEvents as
          | {
              id: number | string
              originalParent: null | number | string
              originalTitle: string
              parent: null | number | string
              title: string
            }[]
          | undefined

        events?.push({
          id: doc.id,
          originalParent: previousDoc?.parent,
          originalTitle: previousDoc?.title,
          parent: doc.parent,
          title: doc.title,
        })
        return doc
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req }) => {
        if (
          req.context.failReparentID !== undefined &&
          req.context.failReparentID === originalDoc?.id
        ) {
          throw new Error('Promotion hook rejected the child')
        }
        const trace = req.context.reparentTrace as
          | { ids: (number | string)[]; targetIDs: (number | string)[] }
          | undefined

        if (originalDoc && trace?.targetIDs.includes(originalDoc.id)) {
          trace.ids.push(originalDoc.id)
          if (trace.ids.length === 2) {
            throw new Error('Promotion hook rejected the second child')
          }
        }
        return data
      },
    ],
    beforeDelete: [
      ({ id, req }) => {
        if (req.context.failDeleteID !== undefined && req.context.failDeleteID === id) {
          throw new Error('Delete hook rejected the child')
        }
        const trace = req.context.deleteTrace as
          | { ids: (number | string)[]; targetIDs: (number | string)[] }
          | undefined

        if (trace?.targetIDs.includes(id)) {
          trace.ids.push(id)
          if (trace.ids.length === 2) {
            throw new Error('Delete hook rejected the second child')
          }
        }
      },
    ],
  },
  versions: { drafts: true },
}
