import type { Where } from 'payload'

type Args = {
  folderID: number | string
}
export function createFolderConstraint({ folderID }: Args): Where {
  return folderID
    ? {
        parentFolder: {
          equals: folderID,
        },
      }
    : {
        or: [
          {
            parentFolder: {
              exists: false,
            },
          },
          {
            parentFolder: {
              equals: undefined,
            },
          },
        ],
      }
}
