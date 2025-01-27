import type { FieldHook } from 'payload/types'

export const generateFullTitle = (breadcrumbs: Array<{ label: string }>): string | undefined => {
  if (Array.isArray(breadcrumbs)) {
    return breadcrumbs.reduce((title, breadcrumb, i) => {
      if (i === 0) return `${breadcrumb.label}`
      return `${title} > ${breadcrumb.label}`
    }, '')
  }

  return undefined
}

const populateFullTitle: FieldHook = async ({ data, originalDoc }) =>
  generateFullTitle(data?.breadcrumbs || originalDoc?.breadcrumbs)

export default populateFullTitle
