import { type Field, type Select, fieldAffectsData, tabHasName } from 'payload/types'

import { buildFieldSelect } from './buildFieldSelect.js'

export const traverseFields = ({
  addProjection,
  fields,
  localeCodes,
  path = '',
  select,
}: {
  addProjection: (path: string) => void
  fields: Field[]
  localeCodes: string[]
  path?: string
  select: Select | boolean
}) => {
  fields.forEach((field) => {
    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        const hasName = tabHasName(tab)

        const tabPath = hasName ? `${path}${tab.name}.` : path
        const tabSelect = hasName ? buildFieldSelect({ field: tab, select }) : select

        if (hasName && tab.localized) {
          localeCodes.forEach((locale) => {
            traverseFields({
              addProjection,
              fields: tab.fields,
              localeCodes,
              path: `${tabPath}${locale}.`,
              select: tabSelect,
            })
          })
        } else
          traverseFields({
            addProjection,
            fields: tab.fields,
            localeCodes,
            path: tabPath,
            select: tabSelect,
          })
      })

      return
    }

    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array': {
          const currentSelect = buildFieldSelect({ field, select })
          if (!currentSelect) break

          const arrayPath = `${path}${field.name}.`

          if (field.localized) {
            localeCodes.map((locale) => {
              const localePath = `${arrayPath}${locale}.`
              addProjection(`${localePath}id`)
              traverseFields({
                addProjection,
                fields: field.fields,
                localeCodes,
                path: `${arrayPath}${locale}.`,
                select: currentSelect,
              })
            })
          } else {
            traverseFields({
              addProjection,
              fields: field.fields,
              localeCodes,
              path: arrayPath,
              select: currentSelect,
            })
          }
          break
        }

        case 'blocks': {
          const currentSelect = buildFieldSelect({ field, select })

          if (!currentSelect) break
          const blocksPath = `${path}${field.name}.`

          if (field.localized) {
            localeCodes.forEach((locale) => {
              const localePath = `${blocksPath}${locale}.`

              const result = field.blocks.map((block) => {
                const blockSelect = buildFieldSelect({ field: block, select: currentSelect })

                if (!blockSelect) return false

                traverseFields({
                  addProjection,
                  fields: block.fields,
                  localeCodes,
                  path: localePath,
                  select: blockSelect,
                })

                return true
              })

              if (result.some(Boolean)) {
                addProjection(`${localePath}id`)
                addProjection(`${localePath}blockType`)
                addProjection(`${localePath}blockName`)
              }
            })
          } else {
            const result = field.blocks.map((block) => {
              const blockSelect = buildFieldSelect({ field: block, select: currentSelect })

              if (!blockSelect) return false

              traverseFields({
                addProjection,
                fields: block.fields,
                localeCodes,
                path: blocksPath,
                select: blockSelect,
              })

              return true
            })

            if (result.some(Boolean)) {
              addProjection(`${blocksPath}id`)
              addProjection(`${blocksPath}blockType`)
              addProjection(`${blocksPath}blockName`)
            }
          }

          break
        }

        case 'group': {
          const currentSelect = buildFieldSelect({ field, select })
          if (!currentSelect) break

          const groupPath = `${path}${field.name}.`

          if (field.localized) {
            localeCodes.forEach((locale) => {
              const localePath = `${groupPath}${locale}.`
              traverseFields({
                addProjection,
                fields: field.fields,
                localeCodes,
                path: localePath,
                select: currentSelect,
              })
            })
          } else {
            traverseFields({
              addProjection,
              fields: field.fields,
              localeCodes,
              path: groupPath,
              select: currentSelect,
            })
          }
          break
        }

        default: {
          const currentSelect = buildFieldSelect({ field, select })

          if (!currentSelect) break

          const fieldPath = `${path}${field.name}`

          if (field.localized) {
            localeCodes.forEach((locale) => {
              addProjection(`${fieldPath}.${locale}`)
            })
          } else {
            addProjection(fieldPath)
          }

          break
        }
      }
    }
  })
}
