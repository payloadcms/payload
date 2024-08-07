import type { Payload } from '..'
import type { Field } from '../fields/config/types'
import type { PathToQuery } from './queryValidation/types'

import { fieldAffectsData } from '../fields/config/types'
import flattenFields from '../utilities/flattenTopLevelFields'

export async function getLocalizedPaths({
  collectionSlug,
  fields,
  globalSlug,
  incomingPath,
  locale,
  overrideAccess = false,
  payload,
}: {
  collectionSlug?: string
  fields: Field[]
  globalSlug?: string
  incomingPath: string
  locale?: string
  overrideAccess?: boolean
  payload: Payload
}): Promise<PathToQuery[]> {
  const pathSegments = incomingPath.split('.')
  const localizationConfig = payload.config.localization

  let paths: PathToQuery[] = [
    {
      collectionSlug,
      complete: false,
      field: undefined,
      fields: flattenFields(fields, false),
      globalSlug,
      invalid: false,
      path: '',
    },
  ]

  for (let i = 0; i < pathSegments.length; i += 1) {
    const segment = pathSegments[i]

    const lastIncompletePath = paths.find(({ complete }) => !complete)

    if (lastIncompletePath) {
      const { path } = lastIncompletePath
      let currentPath = path ? `${path}.${segment}` : segment

      const matchedField = lastIncompletePath.fields.find(
        (field) => fieldAffectsData(field) && field.name === segment,
      )
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
        } else if (localizationConfig && 'localized' in matchedField && matchedField.localized) {
          currentPath = `${currentPath}.${locale}`
        }

        switch (matchedField.type) {
          case 'blocks':
          case 'richText':
          case 'json': {
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

              if (lastSegmentIsValid) {
                lastIncompletePath.complete = true
                lastIncompletePath.path = pathSegments.join('.')
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

                // eslint-disable-next-line no-await-in-loop
                const remainingPaths = await getLocalizedPaths({
                  collectionSlug: relatedCollection.slug,
                  fields: relatedCollection.fields,
                  globalSlug,
                  incomingPath: nestedPathToQuery,
                  locale,
                  payload,
                })

                paths = [...paths, ...remainingPaths]
              }

              return paths
            }

            break
          }

          default: {
            if ('fields' in lastIncompletePath.field) {
              lastIncompletePath.fields = flattenFields(lastIncompletePath.field.fields, false)
            }

            if (i + 1 === pathSegments.length) lastIncompletePath.complete = true
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
