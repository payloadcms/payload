import type { FieldHook } from 'payload'

export const generateFullTitle = (breadcrumbs: Array<{ label: string }>): string | undefined => {
  if (Array.isArray(breadcrumbs)) {
    return breadcrumbs.reduce((title, breadcrumb, i) => {
      if (i === 0) return `${breadcrumb.label}`
      return `${title} > ${breadcrumb.label}`
    }, '')
  }

  return undefined
}

export const populateFullTitle: FieldHook = ({ data, originalDoc }) =>
  generateFullTitle(data?.breadcrumbs || originalDoc?.breadcrumbs)
