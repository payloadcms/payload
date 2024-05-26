import { type Field, type Select, fieldAffectsData, tabHasName } from 'payload/types'

export const traverseFields = ({
  addProjection,
  fields,
  localeCodes,
  schemaPath = '',
  select,
  selectPath = '',
  shouldSelectCurrentLevel,
}: {
  addProjection: (path: string) => void
  fields: Field[]
  localeCodes: string[]
  /** including locales like array.en.title */
  schemaPath?: string
  select: Select
  selectPath?: string
  shouldSelectCurrentLevel?: boolean
}) => {
  fields.forEach((field) => {
    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        const hasName = tabHasName(tab)

        const tabPath = hasName ? `${selectPath}${tab.name}` : selectPath

        if ((select.includes(tabPath) || shouldSelectCurrentLevel) && hasName) {
          addProjection(`${schemaPath}${tab.name}`)
          return
        }

        if (hasName && tab.localized) {
          localeCodes.forEach((locale) => {
            traverseFields({
              addProjection,
              fields: tab.fields,
              localeCodes,
              schemaPath: `${schemaPath}${tabPath}.${locale}.`,
              select,
              selectPath: `${selectPath}${tabPath}.`,
              shouldSelectCurrentLevel,
            })
          })
        } else
          traverseFields({
            addProjection,
            fields: tab.fields,
            localeCodes,
            schemaPath: `${schemaPath}${tabPath}.`,
            select,
            selectPath: `${selectPath}${tabPath}.`,
            shouldSelectCurrentLevel,
          })
      })

      return
    }

    if (fieldAffectsData(field)) {
      switch (field.type) {
        case 'array': {
          if (select.includes(`${selectPath}${field.name}`) || shouldSelectCurrentLevel) {
            addProjection(`${schemaPath}${field.name}`)
            return
          }

          if (field.localized) {
            localeCodes.forEach((locale) => {
              traverseFields({
                addProjection,
                fields: field.fields,
                localeCodes,
                schemaPath: `${schemaPath}${field.name}.${locale}.`,
                select,
                selectPath: `${selectPath}${field.name}.`,
                shouldSelectCurrentLevel,
              })
            })
          } else {
            traverseFields({
              addProjection,
              fields: field.fields,
              localeCodes,
              schemaPath: `${schemaPath}${field.name}.`,
              select,
              selectPath: `${selectPath}${field.name}.`,
              shouldSelectCurrentLevel,
            })
          }
          break
        }

        case 'blocks': {
          const blocksPath = `${selectPath}${field.name}`

          if (select.includes(blocksPath) || shouldSelectCurrentLevel) {
            addProjection(`${schemaPath}${field.name}`)
            return
          }

          if (field.localized) {
            for (const locale of localeCodes) {
              for (const block of field.blocks) {
                traverseFields({
                  addProjection,
                  fields: block.fields,
                  localeCodes,
                  schemaPath: `${schemaPath}${field.name}.${locale}.`,
                  select,
                  selectPath: `${selectPath}${field.name}.${block.slug}.`,
                  shouldSelectCurrentLevel: select.includes(
                    `${selectPath}${field.name}.${block.slug}`,
                  ),
                })
              }
            }
          } else {
            field.blocks.forEach((block) => {
              traverseFields({
                addProjection,
                fields: block.fields,
                localeCodes,
                schemaPath: `${schemaPath}${field.name}.`,
                select,
                selectPath: `${selectPath}${field.name}.${block.slug}.`,
                shouldSelectCurrentLevel: select.includes(
                  `${selectPath}${field.name}.${block.slug}`,
                ),
              })
            })
          }

          break
        }

        case 'group': {
          const groupPath = `${selectPath}${field.name}`
          if (select.includes(groupPath) || shouldSelectCurrentLevel) {
            addProjection(groupPath)
            return
          }

          if (field.localized) {
            localeCodes.forEach((locale) => {
              traverseFields({
                addProjection,
                fields: field.fields,
                localeCodes,
                schemaPath: `${schemaPath}${field.name}.${locale}.`,
                select,
                selectPath: `${selectPath}${field.name}.`,
              })
            })
          } else {
            traverseFields({
              addProjection,
              fields: field.fields,
              localeCodes,
              schemaPath: `${schemaPath}${field.name}.`,
              select,
              selectPath: `${selectPath}${field.name}.`,
            })
          }
          break
        }

        default: {
          if (select.includes(`${selectPath}${field.name}`) || shouldSelectCurrentLevel) {
            addProjection(`${schemaPath}${field.name}`)
          }

          break
        }
      }
    }
  })
}
