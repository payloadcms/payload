import type { JoinQuery, SanitizedJoins, Where } from 'payload'

import {
  appendVersionToQueryKey,
  buildVersionCollectionFields,
  combineQueries,
  getQueryDraftsSort,
} from 'payload'
import { fieldShouldBeLocalized } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'
import { transform } from './transform.js'

export type ResolveJoinsArgs = {
  /** The MongoDB adapter instance */
  adapter: MongooseAdapter
  /** The slug of the collection being queried */
  collectionSlug: string
  /** Array of documents to resolve joins for */
  docs: Record<string, unknown>[]
  /** Join query specifications (which joins to resolve and how) */
  joins?: JoinQuery
  /** Optional locale for localized queries */
  locale?: string
  /** Whether to resolve versions instead of published documents */
  versions?: boolean
}

/**
 * Resolves join relationships for a collection of documents.
 * This function fetches related documents based on join configurations and
 * attaches them to the original documents with pagination support.
 */
export async function resolveJoins({
  adapter,
  collectionSlug,
  docs,
  joins,
  locale,
  versions = false,
}: ResolveJoinsArgs): Promise<void> {
  // Early return if no joins are specified or no documents to process
  if (!joins || docs.length === 0) {
    return
  }

  // Get the collection configuration from the adapter
  const collectionConfig = adapter.payload.collections[collectionSlug]?.config
  if (!collectionConfig) {
    return
  }

  // Build a map of join paths to their configurations for quick lookup
  // This flattens the nested join structure into a single map keyed by join path
  const joinMap: Record<string, { targetCollection: string } & SanitizedJoin> = {}

  // Add regular joins
  for (const [target, joinList] of Object.entries(collectionConfig.joins)) {
    for (const join of joinList || []) {
      joinMap[join.joinPath] = { ...join, targetCollection: target }
    }
  }

  // Add polymorphic joins
  for (const join of collectionConfig.polymorphicJoins || []) {
    // For polymorphic joins, we use the collections array as the target
    joinMap[join.joinPath] = { ...join, targetCollection: join.field.collection as string }
  }

  // Process each requested join concurrently
  const joinPromises = Object.entries(joins).map(async ([joinPath, joinQuery]) => {
    if (!joinQuery) {
      return { joinPath, result: null }
    }

    // Get the join definition from our map
    const joinDef = joinMap[joinPath]
    if (!joinDef) {
      return { joinPath, result: null }
    }

    // Check if this is a polymorphic collection join (where field.collection is an array)
    const isPolymorphicCollectionJoin = Array.isArray(joinDef.field.collection)

    if (isPolymorphicCollectionJoin) {
      // Handle polymorphic collection joins (like documentsAndFolders from folder system)
      // These joins span multiple collections, so we need to query each collection separately
      const allCollections = joinDef.field.collection as string[]

      // Use the provided locale or fall back to the default locale for localized fields
      const localizationConfig = adapter.payload.config.localization
      const effectiveLocale =
        locale ||
        (typeof localizationConfig === 'object' &&
          localizationConfig &&
          localizationConfig.defaultLocale)

      // Extract relationTo filter from the where clause to determine which collections to query
      const relationToFilter = extractRelationToFilter(joinQuery.where || {})

      // Determine which collections to query based on relationTo filter
      const collections = relationToFilter
        ? allCollections.filter((col) => relationToFilter.includes(col))
        : allCollections

      // Group the results by their parent document ID
      // We need to re-query to properly get the parent relationships
      const grouped: Record<string, Record<string, unknown>[]> = {}

      // Process collections concurrently
      const collectionPromises = collections.map(async (collectionSlug) => {
        const targetConfig = adapter.payload.collections[collectionSlug]?.config
        if (!targetConfig) {
          return null
        }

        const useDrafts = versions && Boolean(targetConfig.versions?.drafts)
        let JoinModel
        if (useDrafts) {
          JoinModel = adapter.versions[targetConfig.slug]
        } else {
          JoinModel = adapter.collections[targetConfig.slug]
        }

        if (!JoinModel) {
          return null
        }

        // Extract all parent document IDs to use in the join query
        const parentIDs = docs.map((d) =>
          versions ? (d.parent ?? d._id ?? d.id) : (d._id ?? d.id),
        )

        // Filter WHERE clause to only include fields that exist in this collection
        const filteredWhere = filterWhereForCollection(
          joinQuery.where || {},
          targetConfig.flattenedFields,
          true, // exclude relationTo for individual collections
        )

        // Skip this collection if the WHERE clause cannot be satisfied
        if (filteredWhere === null) {
          return null
        }

        // Build the base query
        const whereQuery = useDrafts
          ? await JoinModel.buildQuery({
              locale,
              payload: adapter.payload,
              where: combineQueries(appendVersionToQueryKey(filteredWhere as Where), {
                latest: {
                  equals: true,
                },
              }),
            })
          : await buildQuery({
              adapter,
              collectionSlug,
              fields: targetConfig.flattenedFields,
              locale,
              where: filteredWhere as Where,
            })

        // Add the join condition
        const joinFieldName = useDrafts ? `version.${joinDef.field.on}` : joinDef.field.on
        whereQuery[joinFieldName] = { $in: parentIDs }

        // Build the sort parameters for the query
        const sort = buildSortParam({
          adapter,
          config: adapter.payload.config,
          fields: useDrafts
            ? buildVersionCollectionFields(adapter.payload.config, targetConfig, true)
            : targetConfig.flattenedFields,
          locale,
          sort: useDrafts
            ? getQueryDraftsSort({
                collectionConfig: targetConfig,
                sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
              })
            : joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
          timestamps: true,
        })

        // Convert sort object to Mongoose-compatible format
        const mongooseSort = Object.entries(sort).reduce(
          (acc, [key, value]) => {
            acc[key] = value === 'desc' ? -1 : 1
            return acc
          },
          {} as Record<string, -1 | 1>,
        )

        // Execute the query, projecting only necessary fields for ObjectID references
        // If sort fields are specified (other than _id), include them for sorting across collections
        const sortProperties = Object.keys(sort)
        const sortEntries = Object.entries(sort) as Array<[string, 'asc' | 'desc']>

        const projection: Record<string, 1> = {
          _id: 1,
          [joinFieldName]: 1,
        }

        if (useDrafts) {
          projection.parent = 1
        }

        // Project all sort fields that aren't _id or relationTo
        if (joinQuery.sort) {
          for (const sortProp of sortProperties) {
            if (sortProp !== '_id' && sortProp !== 'relationTo') {
              projection[sortProp] = 1
            }
          }
        }

        const results = await JoinModel.find(whereQuery, projection).sort(mongooseSort).lean()

        // Return results with collection info for grouping
        return { collectionSlug, joinDef, results, sortEntries, useDrafts }
      })

      const collectionResults = await Promise.all(collectionPromises)

      // Determine if we need to sort by specific fields
      let sortEntries: Array<[string, 'asc' | 'desc']> = []

      if (joinQuery.sort) {
        const firstResult = collectionResults.find((r) => r)
        if (firstResult && firstResult.sortEntries) {
          sortEntries = firstResult.sortEntries
        }
      }

      // Group the results by parent ID
      for (const collectionResult of collectionResults) {
        if (!collectionResult) {
          continue
        }

        const { collectionSlug, joinDef, results, useDrafts } = collectionResult

        for (const result of results) {
          if (useDrafts) {
            result.id = result.parent
          }

          // Get the parent ID from the join field
          const joinFieldPath = useDrafts ? `version.${joinDef.field.on}` : joinDef.field.on
          const parentValue = getByPath(result, joinFieldPath)
          if (!parentValue) {
            continue
          }

          const parentKey = parentValue as string
          if (!grouped[parentKey]) {
            grouped[parentKey] = []
          }

          // Add the ObjectID reference in polymorphic format
          const joinData: Record<string, unknown> = {
            relationTo: collectionSlug,
            value: useDrafts ? result.parent : result._id,
          }

          // Include sort fields if present
          for (const [sortProp] of sortEntries) {
            if (sortProp !== '_id' && sortProp !== 'relationTo' && result[sortProp] !== undefined) {
              joinData[sortProp] = result[sortProp]
            }
          }

          grouped[parentKey].push(joinData)
        }
      }

      // Apply appropriate sorting
      const hasFieldSort = sortEntries.some(([prop]) => prop !== '_id' && prop !== 'relationTo')

      if (hasFieldSort) {
        // Sort by the specified fields across all collections
        for (const parentKey in grouped) {
          grouped[parentKey]!.sort((a, b) => {
            // Compare using each sort field in order
            for (const [sortProp, sortDir] of sortEntries) {
              if (sortProp === '_id' || sortProp === 'relationTo') {
                continue
              }

              const aVal = a[sortProp] as number | string | undefined
              const bVal = b[sortProp] as number | string | undefined
              const direction = sortDir === 'desc' ? -1 : 1

              // Handle undefined/null values
              if (aVal === undefined || aVal === null) {
                if (bVal === undefined || bVal === null) {continue} // Both null, check next field
                return direction
              }
              if (bVal === undefined || bVal === null) {
                return -direction
              }

              // Compare values
              let comparison = 0
              if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal)
              } else if (aVal < bVal) {
                comparison = -1
              } else if (aVal > bVal) {
                comparison = 1
              }

              if (comparison !== 0) {
                return direction * comparison
              }
              // If equal, continue to next sort field
            }

            return 0 // All fields are equal
          })
        }
      } else if (!joinQuery.sort) {
        // For polymorphic collection joins without explicit sort, sort by ObjectID value (newest first)
        // ObjectIDs are naturally sorted by creation time, with newer IDs having higher values
        for (const parentKey in grouped) {
          grouped[parentKey]!.sort((a, b) => {
            // Sort by ObjectID string value in descending order (newest first)
            const aValue = a.value as { toString(): string }
            const bValue = b.value as { toString(): string }
            return bValue.toString().localeCompare(aValue.toString())
          })
        }
      }

      // Apply pagination settings
      const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10
      const page = joinQuery.page ?? 1

      // Determine if the join field should be localized
      const localeSuffix =
        fieldShouldBeLocalized({
          field: joinDef.field,
          parentIsLocalized: joinDef.parentIsLocalized,
        }) &&
        adapter.payload.config.localization &&
        effectiveLocale
          ? `.${effectiveLocale}`
          : ''

      // Adjust the join path with locale suffix if needed
      const localizedJoinPath = `${joinPath}${localeSuffix}`

      return {
        joinPath,
        result: {
          effectiveLocale,
          grouped,
          joinDef,
          joinQuery,
          limit,
          localizedJoinPath,
          page,
        },
      }
    }

    // Handle regular joins (including regular polymorphic joins)
    const targetConfig = adapter.payload.collections[joinDef.field.collection as string]?.config
    if (!targetConfig) {
      return { joinPath, result: null }
    }

    // Determine if we should use drafts/versions for the target collection
    const useDrafts = versions && Boolean(targetConfig.versions?.drafts)

    // Choose the appropriate model based on whether we're querying drafts
    let JoinModel
    if (useDrafts) {
      JoinModel = adapter.versions[targetConfig.slug]
    } else {
      JoinModel = adapter.collections[targetConfig.slug]
    }

    if (!JoinModel) {
      return { joinPath, result: null }
    }

    // Extract all parent document IDs to use in the join query
    const parentIDs = docs.map((d) => (versions ? (d.parent ?? d._id ?? d.id) : (d._id ?? d.id)))

    // Determine the fields to use based on whether we're querying drafts
    const fields = useDrafts
      ? buildVersionCollectionFields(adapter.payload.config, targetConfig, true)
      : targetConfig.flattenedFields

    // Build the base query for the target collection
    const whereQuery = useDrafts
      ? await JoinModel.buildQuery({
          locale,
          payload: adapter.payload,
          where: combineQueries(appendVersionToQueryKey(joinQuery.where || {}), {
            latest: {
              equals: true,
            },
          }),
        })
      : await buildQuery({
          adapter,
          collectionSlug: joinDef.field.collection as string,
          fields: targetConfig.flattenedFields,
          locale,
          where: joinQuery.where || {},
        })

    // Use the provided locale or fall back to the default locale for localized fields
    const localizationConfig = adapter.payload.config.localization
    const effectiveLocale =
      locale ||
      (typeof localizationConfig === 'object' &&
        localizationConfig &&
        localizationConfig.defaultLocale)

    // Handle localized paths and version prefixes
    let dbFieldName = joinDef.field.on
    if (effectiveLocale && typeof localizationConfig === 'object' && localizationConfig) {
      const pathSegments = joinDef.field.on.split('.')
      const transformedSegments: string[] = []

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i]!
        transformedSegments.push(segment)

        // Check if this segment corresponds to a localized field
        const fieldAtSegment = fields.find((f) => f.name === segment)
        if (fieldAtSegment && fieldAtSegment.localized) {
          transformedSegments.push(effectiveLocale)
        }
      }

      dbFieldName = transformedSegments.join('.')
    }

    // Add version prefix for draft queries
    if (useDrafts) {
      dbFieldName = `version.${dbFieldName}`
    }

    // Check if the target field is a polymorphic relationship (for regular joins)
    const isPolymorphic = joinDef.targetField
      ? Array.isArray(joinDef.targetField.relationTo)
      : false

    // Add the join condition: find documents where the join field matches any parent ID
    if (isPolymorphic) {
      // For polymorphic relationships, we need to match both relationTo and value
      whereQuery[`${dbFieldName}.relationTo`] = collectionSlug
      whereQuery[`${dbFieldName}.value`] = { $in: parentIDs }
    } else {
      // For regular relationships
      whereQuery[dbFieldName] = { $in: parentIDs }
    }

    // Build the sort parameters for the query
    const sort = buildSortParam({
      adapter,
      config: adapter.payload.config,
      fields,
      locale,
      sort: useDrafts
        ? getQueryDraftsSort({
            collectionConfig: targetConfig,
            sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
          })
        : joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
      timestamps: true,
    })

    // Convert sort object to Mongoose-compatible format
    // Mongoose expects -1 for descending and 1 for ascending
    const mongooseSort = Object.entries(sort).reduce(
      (acc, [key, value]) => {
        acc[key] = value === 'desc' ? -1 : 1
        return acc
      },
      {} as Record<string, -1 | 1>,
    )

    // Execute the query to get all related documents
    const results = await JoinModel.find(whereQuery, null).sort(mongooseSort).lean()

    // Transform the results to convert _id to id and handle other transformations
    if (useDrafts) {
      // For version documents, manually convert _id to id to preserve nested structure
      for (const result of results) {
        if (result._id) {
          result.id = result._id
          delete result._id
        }
      }
    } else {
      transform({
        adapter,
        data: results,
        fields: targetConfig.fields,
        operation: 'read',
      })
    }

    // Group the results by their parent document ID
    const grouped: Record<string, Record<string, unknown>[]> = {}

    for (const res of results) {
      // Get the parent ID(s) from the result using the join field
      let parents: unknown[]

      if (isPolymorphic) {
        // For polymorphic relationships, extract the value from the polymorphic structure
        const polymorphicField = getByPath(res, dbFieldName) as
          | { relationTo: string; value: unknown }
          | { relationTo: string; value: unknown }[]

        if (Array.isArray(polymorphicField)) {
          // Handle arrays of polymorphic relationships
          parents = polymorphicField
            .filter((item) => item && item.relationTo === collectionSlug)
            .map((item) => item.value)
        } else if (polymorphicField && polymorphicField.relationTo === collectionSlug) {
          // Handle single polymorphic relationship
          parents = [polymorphicField.value]
        } else {
          parents = []
        }
      } else {
        // For regular relationships, use the array-aware function to handle cases where the join field is within an array
        parents = getByPathWithArrays(res, dbFieldName)
      }

      // For version documents, we need to map the result to the parent document
      let resultToAdd = res
      if (useDrafts) {
        // For version documents, we want to return the parent document ID but with the version data
        resultToAdd = {
          ...res,
          id: res.parent || res._id, // Use parent document ID as the ID for joins, fallback to _id
        }
      }

      for (const parent of parents) {
        if (!parent) {
          continue
        }
        const parentKey = parent as string
        if (!grouped[parentKey]) {
          grouped[parentKey] = []
        }
        grouped[parentKey].push(resultToAdd)
      }
    }

    // Apply pagination settings
    const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10
    const page = joinQuery.page ?? 1

    // Determine if the join field should be localized
    const localeSuffix =
      fieldShouldBeLocalized({
        field: joinDef.field,
        parentIsLocalized: joinDef.parentIsLocalized,
      }) &&
      adapter.payload.config.localization &&
      effectiveLocale
        ? `.${effectiveLocale}`
        : ''

    // Adjust the join path with locale suffix if needed
    const localizedJoinPath = `${joinPath}${localeSuffix}`

    return {
      joinPath,
      result: {
        effectiveLocale,
        grouped,
        isPolymorphic: false,
        joinQuery,
        limit,
        localizedJoinPath,
        page,
      },
    }
  })

  // Wait for all join operations to complete
  const joinResults = await Promise.all(joinPromises)

  // Process the results and attach them to documents
  for (const joinResult of joinResults) {
    if (!joinResult || !joinResult.result) {
      continue
    }

    const { result } = joinResult
    const { grouped, joinQuery, limit, localizedJoinPath, page } = result

    // Attach the joined data to each parent document
    for (const doc of docs) {
      const id = (versions ? (doc.parent ?? doc._id ?? doc.id) : (doc._id ?? doc.id)) as string
      const all = grouped[id] || []

      // Calculate the slice for pagination
      // When limit is 0, it means unlimited - return all results
      const slice = limit === 0 ? all : all.slice((page - 1) * limit, (page - 1) * limit + limit)

      // Create the join result object with pagination metadata
      const value: Record<string, unknown> = {
        docs: slice,
        hasNextPage: limit === 0 ? false : all.length > (page - 1) * limit + slice.length,
      }

      // Include total count if requested
      if (joinQuery.count) {
        value.totalDocs = all.length
      }

      // Navigate to the correct nested location in the document and set the join data
      // This handles nested join paths like "user.posts" by creating intermediate objects
      const segments = localizedJoinPath.split('.')
      let ref: Record<string, unknown>
      if (versions) {
        if (!doc.version) {
          doc.version = {}
        }
        ref = doc.version as Record<string, unknown>
      } else {
        ref = doc
      }

      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]!
        if (!ref[seg]) {
          ref[seg] = {}
        }
        ref = ref[seg] as Record<string, unknown>
      }
      // Set the final join data at the target path
      ref[segments[segments.length - 1]!] = value
    }
  }
}

/**
 * Extracts relationTo filter values from a WHERE clause
 * @param where - The WHERE clause to search
 * @returns Array of collection slugs if relationTo filter found, null otherwise
 */
function extractRelationToFilter(where: Record<string, unknown>): null | string[] {
  if (!where || typeof where !== 'object') {
    return null
  }

  // Check for direct relationTo conditions
  if (where.relationTo && typeof where.relationTo === 'object') {
    const relationTo = where.relationTo as Record<string, unknown>
    if (relationTo.in && Array.isArray(relationTo.in)) {
      return relationTo.in as string[]
    }
    if (relationTo.equals) {
      return [relationTo.equals as string]
    }
  }

  // Check for relationTo in logical operators
  if (where.and && Array.isArray(where.and)) {
    for (const condition of where.and) {
      const result = extractRelationToFilter(condition)
      if (result) {
        return result
      }
    }
  }

  if (where.or && Array.isArray(where.or)) {
    for (const condition of where.or) {
      const result = extractRelationToFilter(condition)
      if (result) {
        return result
      }
    }
  }

  return null
}

/**
 * Filters a WHERE clause to only include fields that exist in the target collection
 * This is needed for polymorphic joins where different collections have different fields
 * @param where - The original WHERE clause
 * @param availableFields - The fields available in the target collection
 * @param excludeRelationTo - Whether to exclude relationTo field (for individual collections)
 * @returns A filtered WHERE clause, or null if the query cannot match this collection
 */
function filterWhereForCollection(
  where: Record<string, unknown>,
  availableFields: Array<{ name: string }>,
  excludeRelationTo: boolean = false,
): null | Record<string, unknown> {
  if (!where || typeof where !== 'object') {
    return where
  }

  const fieldNames = new Set(availableFields.map((f) => f.name))
  // Add special fields that are available in polymorphic relationships
  if (!excludeRelationTo) {
    fieldNames.add('relationTo')
  }

  const filtered: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(where)) {
    if (key === 'and') {
      // Handle AND operator - all conditions must be satisfiable
      if (Array.isArray(value)) {
        const filteredConditions: Record<string, unknown>[] = []

        for (const condition of value) {
          const filteredCondition = filterWhereForCollection(
            condition,
            availableFields,
            excludeRelationTo,
          )

          // If any condition in AND cannot be satisfied, the whole AND fails
          if (filteredCondition === null) {
            return null
          }

          if (Object.keys(filteredCondition).length > 0) {
            filteredConditions.push(filteredCondition)
          }
        }

        if (filteredConditions.length > 0) {
          filtered[key] = filteredConditions
        }
      }
    } else if (key === 'or') {
      // Handle OR operator - at least one condition must be satisfiable
      if (Array.isArray(value)) {
        const filteredConditions = value
          .map((condition) =>
            filterWhereForCollection(condition, availableFields, excludeRelationTo),
          )
          .filter((condition) => condition !== null && Object.keys(condition).length > 0)

        if (filteredConditions.length > 0) {
          filtered[key] = filteredConditions
        }
        // If no OR conditions can be satisfied, we still continue (OR is more permissive)
      }
    } else if (key === 'relationTo' && excludeRelationTo) {
      // Skip relationTo field for non-polymorphic collections
      continue
    } else if (fieldNames.has(key)) {
      // Include the condition if the field exists in this collection
      filtered[key] = value
    } else {
      // Field doesn't exist in this collection - this makes the query unsatisfiable
      return null
    }
  }

  return filtered
}

type SanitizedJoin = SanitizedJoins[string][number]

/**
 * Utility function to safely traverse nested object properties using dot notation
 * @param doc - The document to traverse
 * @param path - Dot-separated path (e.g., "user.profile.name")
 * @returns The value at the specified path, or undefined if not found
 */
function getByPath(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((val, segment) => {
    if (val === undefined || val === null) {
      return undefined
    }
    return (val as Record<string, unknown>)[segment]
  }, doc)
}

/**
 * Enhanced utility function to safely traverse nested object properties using dot notation
 * Handles arrays by searching through array elements for matching values
 * @param doc - The document to traverse
 * @param path - Dot-separated path (e.g., "array.category")
 * @returns Array of values found at the specified path (for arrays) or single value
 */
function getByPathWithArrays(doc: unknown, path: string): unknown[] {
  const segments = path.split('.')
  let current = doc

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!

    if (current === undefined || current === null) {
      return []
    }

    // Get the value at the current segment
    const value = (current as Record<string, unknown>)[segment]

    if (value === undefined || value === null) {
      return []
    }

    // If this is the last segment, return the value(s)
    if (i === segments.length - 1) {
      return Array.isArray(value) ? value : [value]
    }

    // If the value is an array and we have more segments to traverse
    if (Array.isArray(value)) {
      const remainingPath = segments.slice(i + 1).join('.')
      const results: unknown[] = []

      // Search through each array element
      for (const item of value) {
        if (item && typeof item === 'object') {
          const subResults = getByPathWithArrays(item, remainingPath)
          results.push(...subResults)
        }
      }

      return results
    }

    // Continue traversing
    current = value
  }

  return []
}
