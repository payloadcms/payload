/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'
import type { Field, TabAsField } from 'payload/types'

import { fieldAffectsData } from 'payload/types'

import type { BlocksMap } from '../../utilities/createBlocksMap'

import { transformHasManyNumber } from './hasManyNumber'
import { transformHasManyText } from './hasManyText'
import { transformRelationship } from './relationship'

type TraverseFieldsArgs = {
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
  blocks,
  config,
  dataRef,
  deletions,
  fieldPrefix,
  fields,
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
        blocks,
        config,
        dataRef,
        deletions,
        fieldPrefix,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
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
        blocks,
        config,
        dataRef,
        deletions,
        fieldPrefix,
        fields: field.fields,
        numbers,
        path,
        relationships,
        table,
        texts,
        withinArrayOrBlockLocale,
      })
    }

    if (fieldAffectsData(field)) {
      const fieldName = `${fieldPrefix || ''}${field.name}`
      const fieldData = table[fieldName]

      if (fieldPrefix) {
        deletions.push(() => delete table[fieldName])
      }

      if (field.type === 'array') {
        if (Array.isArray(fieldData)) {
          if (field.localized) {
            result[field.name] = fieldData.reduce((arrayResult, row) => {
              if (typeof row._locale === 'string') {
                if (!arrayResult[row._locale]) arrayResult[row._locale] = []
                const locale = row._locale
                const data = {}
                delete row._locale
                if (row._uuid) {
                  row.id = row._uuid
                  delete row._uuid
                }

                const rowResult = traverseFields<T>({
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
                if (!result[field.name][row._locale]) result[field.name][row._locale] = []
                result[field.name][row._locale].push(row)
                delete row._locale
              }
            })

            Object.entries(result[field.name]).forEach(([locale, localizedBlocks]) => {
              result[field.name][locale] = localizedBlocks.map((row) => {
                const block = field.blocks.find(({ slug }) => slug === row.blockType)

                if (block) {
                  const blockResult = traverseFields<T>({
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
              if (!relationsByLocale[row.locale]) relationsByLocale[row.locale] = []
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

      if (field.type === 'text' && field?.hasMany) {
        const textPathMatch = texts[`${sanitizedPath}${field.name}`]
        if (!textPathMatch) return result

        if (field.localized) {
          result[field.name] = {}
          const textsByLocale: Record<string, Record<string, unknown>[]> = {}

          textPathMatch.forEach((row) => {
            if (typeof row.locale === 'string') {
              if (!textsByLocale[row.locale]) textsByLocale[row.locale] = []
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
        if (!numberPathMatch) return result

        if (field.localized) {
          result[field.name] = {}
          const numbersByLocale: Record<string, Record<string, unknown>[]> = {}

          numberPathMatch.forEach((row) => {
            if (typeof row.locale === 'string') {
              if (!numbersByLocale[row.locale]) numbersByLocale[row.locale] = []
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
                if (!selectResult[row.locale]) selectResult[row.locale] = []
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

      const localizedFieldData = {}
      const valuesToTransform: {
        ref: Record<string, unknown>
        table: Record<string, unknown>
      }[] = []

      if (field.localized && Array.isArray(table._locales)) {
        if (!table._locales.length && config.localization) {
          config.localization.localeCodes.forEach((_locale) =>
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

        switch (field.type) {
          case 'tab':
          case 'group': {
            const groupFieldPrefix = `${fieldPrefix || ''}${field.name}_`
            const groupData = {}
            const locale = table._locale as string
            const refKey = field.localized && locale ? locale : field.name

            if (field.localized && locale) delete table._locale
            ref[refKey] = traverseFields<Record<string, unknown>>({
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

            break
          }

          case 'text': {
            let val = fieldData
            if (typeof fieldData === 'string') {
              val = String(fieldData)
            }

            if (typeof locale === 'string') {
              ref[locale] = val
            } else {
              result[field.name] = val
            }

            break
          }

          case 'number': {
            let val = fieldData
            if (typeof fieldData === 'string') {
              val = Number.parseFloat(fieldData)
            }

            if (typeof locale === 'string') {
              ref[locale] = val
            } else {
              result[field.name] = val
            }

            break
          }

          case 'date': {
            let val = fieldData

            if (typeof fieldData === 'string') {
              val = new Date(fieldData).toISOString()
            }

            if (typeof locale === 'string') {
              ref[locale] = val
            } else {
              result[field.name] = val
            }

            break
          }

          default: {
            if (typeof locale === 'string') {
              ref[locale] = fieldData
            } else {
              result[field.name] = fieldData
            }

            break
          }
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
