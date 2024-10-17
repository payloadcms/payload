import type { Field, JoinQuery, SanitizedConfig, TabAsField } from 'payload'

import { fieldAffectsData, fieldIsVirtual } from 'payload/shared'

import type { DrizzleAdapter } from '../../types.js'
import type { BlocksMap } from '../../utilities/createBlocksMap.js'

import { transformHasManyNumber } from './hasManyNumber.js'
import { transformHasManyText } from './hasManyText.js'
import { transformRelationship } from './relationship.js'

type TraverseFieldsArgs = {
  /**
   * The DB adapter
   */
  adapter: DrizzleAdapter
  /**
   * Pre-formatted blocks map
   */
  blocks: BlocksMap
  /**
   * The full Payload config
   */
  config: SanitizedConfig
  /**
   * The data reference to be mutated within this recursive function
   */
  dataRef: Record<string, unknown>
  /**
   * Data that needs to be removed from the result after all fields have populated
   */
  deletions: (() => void)[]
  /**
   * Column prefix can be built up by group and named tab fields
   */
  fieldPrefix: string
  /**
   * An array of Payload fields to traverse
   */
  fields: (Field | TabAsField)[]
  /**
   *
   */
  joinQuery?: JoinQuery
  /**
   * All hasMany number fields, as returned by Drizzle, keyed on an object by field path
   */
  numbers: Record<string, Record<string, unknown>[]>
  /**
   * The current field path (in dot notation), used to merge in relationships
   */
  path: string
  /**
   * All related documents, as returned by Drizzle, keyed on an object by field path
   */
  relationships: Record<string, Record<string, unknown>[]>
  /**
   * Data structure representing the nearest table from db
   */
  table: Record<string, unknown>
  /**
   * All hasMany text fields, as returned by Drizzle, keyed on an object by field path
   */
  texts: Record<string, Record<string, unknown>[]>
  /**
   * Set to a locale if this group of fields is within a localized array or block.
   */
  withinArrayOrBlockLocale?: string
}

// Traverse fields recursively, transforming data
// for each field type into required Payload shape
export const traverseFields = <T extends Record<string, unknown>>({
  adapter,
  blocks,
  config,
  dataRef,
  deletions,
  fieldPrefix,
  fields,
  joinQuery,
  numbers,
  path,
  relationships,
  table,
  texts,
  withinArrayOrBlockLocale,
}: TraverseFieldsArgs): T => {
  const sanitizedPath = path ? `${path}.` : path

  const formatted = fields.reduce((result, field) => {
    if (field.type === 'tabs') {
      traverseFields({
        adapter,
        blocks,
        config,
        dataRef,
        deletions,
        fieldPrefix,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        joinQuery,
        numbers,
        path,
        relationships,
        table,
        texts,
        withinArrayOrBlockLocale,
      })
    }

    if (
      field.type === 'collapsible' ||
      field.type === 'row' ||
      (field.type === 'tab' && !('name' in field))
    ) {
      traverseFields({
        adapter,
        blocks,
        config,
        dataRef,
        deletions,
        fieldPrefix,
        fields: field.fields,
        joinQuery,
        numbers,
        path,
        relationships,
        table,
        texts,
        withinArrayOrBlockLocale,
      })
    }

    if (fieldAffectsData(field)) {
      if (fieldIsVirtual(field)) {
        return result
      }

      const fieldName = `${fieldPrefix || ''}${field.name}`
      let fieldData = table[fieldName]
      const localizedFieldData = {}
      const valuesToTransform: {
        ref: Record<string, unknown>
        table: Record<string, unknown>
      }[] = []

      if (fieldPrefix) {
        deletions.push(() => delete table[fieldName])
      }

      if (field.type === 'array') {
        if (Array.isArray(fieldData)) {
          if (field.localized) {
            result[field.name] = fieldData.reduce((arrayResult, row) => {
              if (typeof row._locale === 'string') {
                if (!arrayResult[row._locale]) {
                  arrayResult[row._locale] = []
                }
                const locale = row._locale
                const data = {}
                delete row._locale
                if (row._uuid) {
                  row.id = row._uuid
                  delete row._uuid
                }

                const rowResult = traverseFields<T>({
                  adapter,
                  blocks,
                  config,
                  dataRef: data,
                  deletions,
                  fieldPrefix: '',
                  fields: field.fields,
                  numbers,
                  path: `${sanitizedPath}${field.name}.${row._order - 1}`,
                  relationships,
                  table: row,
                  texts,
                  withinArrayOrBlockLocale: locale,
                })

                if ('_order' in rowResult) {
                  delete rowResult._order
                }

                arrayResult[locale].push(rowResult)
              }

              return arrayResult
            }, {})
          } else {
            result[field.name] = fieldData.reduce((acc, row, i) => {
              if (row._uuid) {
                row.id = row._uuid
                delete row._uuid
              }

              if ('_order' in row) {
                delete row._order
              }

              if (
                !withinArrayOrBlockLocale ||
                (withinArrayOrBlockLocale && withinArrayOrBlockLocale === row._locale)
              ) {
                if (row._locale) {
                  delete row._locale
                }

                acc.push(
                  traverseFields<T>({
                    adapter,
                    blocks,
                    config,
                    dataRef: row,
                    deletions,
                    fieldPrefix: '',
                    fields: field.fields,
                    numbers,
                    path: `${sanitizedPath}${field.name}.${i}`,
                    relationships,
                    table: row,
                    texts,
                    withinArrayOrBlockLocale,
                  }),
                )
              }

              return acc
            }, [])
          }
        }

        return result
      }

      if (field.type === 'blocks') {
        const blockFieldPath = `${sanitizedPath}${field.name}`
        const blocksByPath = blocks[blockFieldPath]

        if (Array.isArray(blocksByPath)) {
          if (field.localized) {
            result[field.name] = {}

            blocksByPath.forEach((row) => {
              if (row._uuid) {
                row.id = row._uuid
                delete row._uuid
              }
              if (typeof row._locale === 'string') {
                if (!result[field.name][row._locale]) {
                  result[field.name][row._locale] = []
                }
                result[field.name][row._locale].push(row)
                delete row._locale
              }
            })

            Object.entries(result[field.name]).forEach(([locale, localizedBlocks]) => {
              result[field.name][locale] = localizedBlocks.map((row) => {
                const block = field.blocks.find(({ slug }) => slug === row.blockType)

                if (block) {
                  const blockResult = traverseFields<T>({
                    adapter,
                    blocks,
                    config,
                    dataRef: row,
                    deletions,
                    fieldPrefix: '',
                    fields: block.fields,
                    numbers,
                    path: `${blockFieldPath}.${row._order - 1}`,
                    relationships,
                    table: row,
                    texts,
                    withinArrayOrBlockLocale: locale,
                  })

                  delete blockResult._order
                  return blockResult
                }

                return {}
              })
            })
          } else {
            // Add locale-specific index to have a proper blockFieldPath for current locale
            // because blocks can be in the same array for different locales!
            if (withinArrayOrBlockLocale && config.localization) {
              for (const locale of config.localization.localeCodes) {
                let localeIndex = 0

                for (let i = 0; i < blocksByPath.length; i++) {
                  const row = blocksByPath[i]
                  if (row._locale === locale) {
                    row._index = localeIndex
                    localeIndex++
                  }
                }
              }
            }

            result[field.name] = blocksByPath.reduce((acc, row, i) => {
              delete row._order
              if (row._uuid) {
                row.id = row._uuid
                delete row._uuid
              }
              const block = field.blocks.find(({ slug }) => slug === row.blockType)

              if (block) {
                if (
                  !withinArrayOrBlockLocale ||
                  (withinArrayOrBlockLocale && withinArrayOrBlockLocale === row._locale)
                ) {
                  if (row._locale) {
                    delete row._locale
                  }
                  if (typeof row._index === 'number') {
                    i = row._index
                    delete row._index
                  }

                  acc.push(
                    traverseFields<T>({
                      adapter,
                      blocks,
                      config,
                      dataRef: row,
                      deletions,
                      fieldPrefix: '',
                      fields: block.fields,
                      numbers,
                      path: `${blockFieldPath}.${i}`,
                      relationships,
                      table: row,
                      texts,
                      withinArrayOrBlockLocale,
                    }),
                  )

                  return acc
                }
              } else {
                acc.push({})
              }

              return acc
            }, [])
          }
        }

        return result
      }

      if (field.type === 'relationship' || field.type === 'upload') {
        if (typeof field.relationTo === 'string' && !('hasMany' in field && field.hasMany)) {
          if (
            field.localized &&
            config.localization &&
            config.localization.locales &&
            Array.isArray(table?._locales)
          ) {
            table._locales.forEach((localeRow) => {
              result[field.name] = { [localeRow._locale]: localeRow[fieldName] }
            })
          } else {
            valuesToTransform.push({ ref: result, table })
          }
        } else {
          const relationPathMatch = relationships[`${sanitizedPath}${field.name}`]

          if (!relationPathMatch) {
            if ('hasMany' in field && field.hasMany) {
              if (field.localized && config.localization && config.localization.locales) {
                result[field.name] = {
                  [config.localization.defaultLocale]: [],
                }
              } else {
                result[field.name] = []
              }
            }

            return result
          }

          if (field.localized) {
            result[field.name] = {}
            const relationsByLocale: Record<string, Record<string, unknown>[]> = {}

            relationPathMatch.forEach((row) => {
              if (typeof row.locale === 'string') {
                if (!relationsByLocale[row.locale]) {
                  relationsByLocale[row.locale] = []
                }
                relationsByLocale[row.locale].push(row)
              }
            })

            Object.entries(relationsByLocale).forEach(([locale, relations]) => {
              transformRelationship({
                field,
                locale,
                ref: result,
                relations,
              })
            })
          } else {
            transformRelationship({
              field,
              ref: result,
              relations: relationPathMatch,
              withinArrayOrBlockLocale,
            })
          }
          return result
        }
      }

      if (field.type === 'join') {
        const { limit = 10 } = joinQuery?.[`${fieldPrefix.replaceAll('_', '.')}${field.name}`] || {}

        // raw hasMany results from SQLite
        if (typeof fieldData === 'string') {
          fieldData = JSON.parse(fieldData)
        }

        let fieldResult:
          | { docs: unknown[]; hasNextPage: boolean }
          | Record<string, { docs: unknown[]; hasNextPage: boolean }>
        if (Array.isArray(fieldData)) {
          if (field.localized) {
            fieldResult = fieldData.reduce((joinResult, row) => {
              if (typeof row._locale === 'string') {
                if (!joinResult[row._locale]) {
                  joinResult[row._locale] = {
                    docs: [],
                    hasNextPage: false,
                  }
                }
                joinResult[row._locale].docs.push(row._parentID)
              }

              return joinResult
            }, {})
            Object.keys(fieldResult).forEach((locale) => {
              fieldResult[locale].hasNextPage = fieldResult[locale].docs.length > limit
              fieldResult[locale].docs = fieldResult[locale].docs.slice(0, limit)
            })
          } else {
            const hasNextPage = limit !== 0 && fieldData.length > limit
            fieldResult = {
              docs: (hasNextPage ? fieldData.slice(0, limit) : fieldData).map(({ id }) => ({
                id,
              })),
              hasNextPage,
            }
          }
        }

        result[field.name] = fieldResult
        return result
      }

      if (field.type === 'text' && field?.hasMany) {
        const textPathMatch = texts[`${sanitizedPath}${field.name}`]
        if (!textPathMatch) {
          return result
        }

        if (field.localized) {
          result[field.name] = {}
          const textsByLocale: Record<string, Record<string, unknown>[]> = {}

          textPathMatch.forEach((row) => {
            if (typeof row.locale === 'string') {
              if (!textsByLocale[row.locale]) {
                textsByLocale[row.locale] = []
              }
              textsByLocale[row.locale].push(row)
            }
          })

          Object.entries(textsByLocale).forEach(([locale, texts]) => {
            transformHasManyText({
              field,
              locale,
              ref: result,
              textRows: texts,
            })
          })
        } else {
          transformHasManyText({
            field,
            ref: result,
            textRows: textPathMatch,
            withinArrayOrBlockLocale,
          })
        }

        return result
      }

      if (field.type === 'number' && field.hasMany) {
        const numberPathMatch = numbers[`${sanitizedPath}${field.name}`]
        if (!numberPathMatch) {
          return result
        }

        if (field.localized) {
          result[field.name] = {}
          const numbersByLocale: Record<string, Record<string, unknown>[]> = {}

          numberPathMatch.forEach((row) => {
            if (typeof row.locale === 'string') {
              if (!numbersByLocale[row.locale]) {
                numbersByLocale[row.locale] = []
              }
              numbersByLocale[row.locale].push(row)
            }
          })

          Object.entries(numbersByLocale).forEach(([locale, numbers]) => {
            transformHasManyNumber({
              field,
              locale,
              numberRows: numbers,
              ref: result,
            })
          })
        } else {
          transformHasManyNumber({
            field,
            numberRows: numberPathMatch,
            ref: result,
            withinArrayOrBlockLocale,
          })
        }

        return result
      }

      if (field.type === 'select' && field.hasMany) {
        if (Array.isArray(fieldData)) {
          if (field.localized) {
            result[field.name] = fieldData.reduce((selectResult, row) => {
              if (typeof row.locale === 'string') {
                if (!selectResult[row.locale]) {
                  selectResult[row.locale] = []
                }
                selectResult[row.locale].push(row.value)
              }

              return selectResult
            }, {})
          } else {
            let selectData = fieldData
            if (withinArrayOrBlockLocale) {
              selectData = selectData.filter(({ locale }) => locale === withinArrayOrBlockLocale)
            }
            result[field.name] = selectData.map(({ value }) => value)
          }
        }
        return result
      }

      if (field.localized && Array.isArray(table._locales)) {
        if (!table._locales.length && adapter.payload.config.localization) {
          adapter.payload.config.localization.localeCodes.forEach((_locale) =>
            (table._locales as unknown[]).push({ _locale }),
          )
        }

        table._locales.forEach((localeRow) => {
          valuesToTransform.push({
            ref: localizedFieldData,
            table: {
              ...table,
              ...localeRow,
            },
          })
        })
      } else {
        valuesToTransform.push({ ref: result, table })
      }

      valuesToTransform.forEach(({ ref, table }) => {
        const fieldData = table[`${fieldPrefix || ''}${field.name}`]
        const locale = table?._locale
        let val = fieldData

        switch (field.type) {
          case 'tab':
          case 'group': {
            const groupFieldPrefix = `${fieldPrefix || ''}${field.name}_`
            const groupData = {}
            const locale = table._locale as string
            const refKey = field.localized && locale ? locale : field.name

            if (field.localized && locale) {
              delete table._locale
            }
            ref[refKey] = traverseFields<Record<string, unknown>>({
              adapter,
              blocks,
              config,
              dataRef: groupData as Record<string, unknown>,
              deletions,
              fieldPrefix: groupFieldPrefix,
              fields: field.fields,
              numbers,
              path: `${sanitizedPath}${field.name}`,
              relationships,
              table,
              texts,
              withinArrayOrBlockLocale: locale || withinArrayOrBlockLocale,
            })

            if ('_order' in ref) {
              delete ref._order
            }

            return
          }

          case 'text': {
            if (typeof fieldData === 'string') {
              val = String(fieldData)
            }

            break
          }

          case 'number': {
            if (typeof fieldData === 'string') {
              val = Number.parseFloat(fieldData)
            }

            break
          }

          case 'date': {
            if (typeof fieldData === 'string') {
              val = new Date(fieldData).toISOString()
            }

            break
          }

          case 'relationship':
          case 'upload': {
            if (
              val &&
              typeof field.relationTo === 'string' &&
              adapter.payload.collections[field.relationTo].customIDType === 'number'
            ) {
              val = Number(val)
            }

            break
          }

          default: {
            break
          }
        }
        if (typeof locale === 'string') {
          ref[locale] = val
        } else {
          result[field.name] = val
        }
      })

      if (Object.keys(localizedFieldData).length > 0) {
        result[field.name] = localizedFieldData
      }

      return result
    }

    return result
  }, dataRef)

  if (Array.isArray(table._locales)) {
    deletions.push(() => delete table._locales)
  }

  return formatted as T
}
