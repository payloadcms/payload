import type { TextField } from '../../fields/config/types.js'

type Args = {
  debug?: boolean
  useAsTitle: string
}

export function createBaseFolderSearchField({ debug, useAsTitle }: Args): TextField {
  return {
    name: '_folderSearch',
    type: 'text',
    admin: {
      hidden: !debug,
    },
    hooks: {
      beforeChange: [
        ({ data, operation, originalDoc, value }) => {
          if (operation === 'create' || operation === 'update') {
            if (data && useAsTitle in data) {
              return data[useAsTitle]
            } else if (originalDoc && useAsTitle in originalDoc) {
              return originalDoc[useAsTitle]
            }
            return value
          }
        },
      ],
    },
    index: true,
  }
}
