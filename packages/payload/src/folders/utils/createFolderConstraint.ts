import type { Where } from '../../index.js'

export function createFolderConstraint({ folderID }): Where {
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
