import type { Payload } from '../index.js'
import type { PathToQuery } from './queryValidation/types.js'

// @ts-strict-ignore
import {
  type Field,
  fieldShouldBeLocalized,
  type FlattenedBlock,
  type FlattenedField,
} from '../fields/config/types.js'

export function getLocalizedPaths({
  collectionSlug,
  fields,
  globalSlug,
  incomingPath,
  locale,
  overrideAccess = false,
  parentIsLocalized,
  payload,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  incomingPath: string
  locale?: string
  overrideAccess?: boolean
  /**
   * @todo make required in v4.0. Usually, you'd wanna pass this through
   */
  parentIsLocalized?: boolean
  payload: Payload
}): PathToQuery[] {
  const pathSegments = incomingPath.split('.')
  const localizationConfig = payload.config.localization

  let paths: PathToQuery[] = [
    {
      collectionSlug,
      complete: false,
      field: undefined,
      fields,
      globalSlug,
      invalid: false,
      parentIsLocalized,
      path: '',
    },
  ]

  for (let i = 0; i < pathSegments.length; i += 1) {
    const segment = pathSegments[i]

    const lastIncompletePath = paths.find(({ complete }) => !complete)

    if (lastIncompletePath) {
      const { path } = lastIncompletePath
      let currentPath = path ? `${path}.${segment}` : segment

      let fieldsToSearch: FlattenedField[]
      let _parentIsLocalized = parentIsLocalized

      let matchedField: FlattenedField

      if (lastIncompletePath?.field?.type === 'blocks') {
        if (segment === 'blockType') {
          matchedField = {
            name: 'blockType',
            type: 'text',
          }
        } else {
          for (const _block of lastIncompletePath.field.blockReferences ??
            lastIncompletePath.field.blocks) {
            let block: FlattenedBlock
            if (typeof _block === 'string') {
              block = payload?.blocks[_block]
            } else {
              block = _block
            }

            matchedField = block.flattenedFields.find((field) => field.name === segment)
            if (matchedField) {
              break
            }
          }
        }
      } else {
        if (lastIncompletePath?.field && 'flattenedFields' in lastIncompletePath.field) {
          fieldsToSearch = lastIncompletePath.field.flattenedFields
        } else {
          fieldsToSearch = lastIncompletePath.fields
        }
        _parentIsLocalized = parentIsLocalized || lastIncompletePath.field?.localized

        matchedField = fieldsToSearch.find((field) => field.name === segment)
      }

      lastIncompletePath.field = matchedField

      if (currentPath === 'globalType' && globalSlug) {
        lastIncompletePath.path = currentPath
        lastIncompletePath.complete = true
        lastIncompletePath.field = {
          name: 'globalType',
          type: 'text',
        }

        return paths
      }

      if (currentPath === 'relationTo') {
        lastIncompletePath.path = currentPath
        lastIncompletePath.complete = true
        lastIncompletePath.field = {
          name: 'relationTo',
          type: 'select',
          options: Object.keys(payload.collections),
        }

        return paths
      }

      if (!matchedField && currentPath === 'id' && i === pathSegments.length - 1) {
        lastIncompletePath.path = currentPath
        const idField: Field = {
          name: 'id',
          type: payload.db.defaultIDType as 'text',
        }
        lastIncompletePath.field = idField
        lastIncompletePath.complete = true
        return paths
      }

      if (matchedField) {
        if ('hidden' in matchedField && matchedField.hidden && !overrideAccess) {
          lastIncompletePath.invalid = true
        }

        const nextSegment = pathSegments[i + 1]
        const nextSegmentIsLocale =
          localizationConfig && localizationConfig.localeCodes.includes(nextSegment)

        if (nextSegmentIsLocale) {
          // Skip the next iteration, because it's a locale
          i += 1
          currentPath = `${currentPath}.${nextSegment}`
        } else if (
          localizationConfig &&
          fieldShouldBeLocalized({ field: matchedField, parentIsLocalized: _parentIsLocalized })
        ) {
          currentPath = `${currentPath}.${locale}`
        }

        switch (matchedField.type) {
          case 'json':
          case 'richText': {
            const upcomingSegments = pathSegments.slice(i + 1).join('.')
            lastIncompletePath.complete = true
            lastIncompletePath.path = upcomingSegments
              ? `${currentPath}.${upcomingSegments}`
              : currentPath
            return paths
          }

          case 'relationship':
          case 'upload': {
            // If this is a polymorphic relation,
            // We only support querying directly (no nested querying)
            if (typeof matchedField.relationTo !== 'string') {
              const lastSegmentIsValid =
                ['relationTo', 'value'].includes(pathSegments[pathSegments.length - 1]) ||
                pathSegments.length === 1 ||
                (pathSegments.length === 2 && pathSegments[0] === 'version')

              lastIncompletePath.path = pathSegments.join('.')

              if (lastSegmentIsValid) {
                lastIncompletePath.complete = true
              } else {
                lastIncompletePath.invalid = true
                return paths
              }
            } else {
              lastIncompletePath.complete = true
              lastIncompletePath.path = currentPath

              const nestedPathToQuery = pathSegments
                .slice(nextSegmentIsLocale ? i + 2 : i + 1)
                .join('.')

              if (nestedPathToQuery) {
                const relatedCollection = payload.collections[matchedField.relationTo].config

                const remainingPaths = getLocalizedPaths({
                  collectionSlug: relatedCollection.slug,
                  fields: relatedCollection.flattenedFields,
                  globalSlug,
                  incomingPath: nestedPathToQuery,
                  locale,
                  parentIsLocalized: false,
                  payload,
                })

                paths = [...paths, ...remainingPaths]
              }

              return paths
            }

            break
          }

          default: {
            if (i + 1 === pathSegments.length) {
              lastIncompletePath.complete = true
            }
            lastIncompletePath.path = currentPath
          }
        }
      } else {
        lastIncompletePath.invalid = true
        lastIncompletePath.path = currentPath
        return paths
      }
    }
  }

  return paths
}
