import type { Block } from 'payload/types'

export const ProjectGrid: Block = {
  slug: 'projectGrid',
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      required: true,
    },
  ],
}
