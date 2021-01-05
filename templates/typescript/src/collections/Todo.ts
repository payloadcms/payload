import { CollectionConfig } from 'payload/types';

const Todo: CollectionConfig = {
  slug: 'todo',
  labels: {
    singular: 'Todo List',
    plural: 'Todo Lists',
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'items',
      label: 'Items',
      type: 'array',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
        },
        {
          name: 'complete',
          label: 'Complete',
          type: 'checkbox',
          defaultValue: false,
        }
      ]
    },
  ],
}

export default Todo;