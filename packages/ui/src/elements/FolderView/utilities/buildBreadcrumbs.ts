import type { Breadcrumb, FolderInterface } from '../types.js'

export function buildBreadCrumbs(crumbs: Breadcrumb[], folder: FolderInterface): Breadcrumb[] {
  if (typeof folder === 'object' && folder !== null) {
    crumbs.push({
      id: folder.id,
      name: folder.name,
    })
  }

  if (folder && typeof folder.parentFolder === 'object' && folder.parentFolder !== null) {
    return buildBreadCrumbs(crumbs, folder.parentFolder)
  }

  return crumbs
}
