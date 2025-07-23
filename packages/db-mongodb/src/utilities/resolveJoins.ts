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
  /** Optional projection for the join query */
  projection?: Record<string, true>
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
  projection,
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
    for (const join of joinList) {
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
      return null
    }

    // If a projection is provided, and the join path is not in the projection, skip it
    if (projection && !projection[joinPath]) {
      return null
    }

    // Get the join definition from our map
    const joinDef = joinMap[joinPath]
    if (!joinDef) {
      return null
    }

    // Normalize collections to always be an array for unified processing
    const allCollections = Array.isArray(joinDef.field.collection)
      ? joinDef.field.collection
      : [joinDef.field.collection]

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

    // Check if this is a polymorphic collection join (where field.collection is an array)
    const isPolymorphicJoin = Array.isArray(joinDef.field.collection)

    // Apply pagination settings
    const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10
    const page = joinQuery.page ?? 1
    const skip = (page - 1) * limit

    // Process collections concurrently
    const collectionPromises = collections.map(async (joinCollectionSlug) => {
      const targetConfig = adapter.payload.collections[joinCollectionSlug]?.config
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
      const parentIDs = docs.map((d) => (versions ? (d.parent ?? d._id ?? d.id) : (d._id ?? d.id)))

      // Build the base query
      let whereQuery: null | Record<string, unknown> = null
      whereQuery = isPolymorphicJoin
        ? filterWhereForCollection(
            joinQuery.where || {},
            targetConfig.flattenedFields,
            true, // exclude relationTo for individual collections
          )
        : joinQuery.where || {}

      // Skip this collection if the WHERE clause cannot be satisfied for polymorphic collection joins
      if (whereQuery === null) {
        return null
      }
      whereQuery = useDrafts
        ? await JoinModel.buildQuery({
            locale,
            payload: adapter.payload,
            where: combineQueries(appendVersionToQueryKey(whereQuery as Where), {
              latest: {
                equals: true,
              },
            }),
          })
        : await buildQuery({
            adapter,
            collectionSlug: joinCollectionSlug,
            fields: targetConfig.flattenedFields,
            locale,
            where: whereQuery as Where,
          })

      // Handle localized paths and version prefixes
      let dbFieldName = joinDef.field.on

      if (effectiveLocale && typeof localizationConfig === 'object' && localizationConfig) {
        const pathSegments = joinDef.field.on.split('.')
        const transformedSegments: string[] = []
        const fields = useDrafts
          ? buildVersionCollectionFields(adapter.payload.config, targetConfig, true)
          : targetConfig.flattenedFields

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

      // Check if the target field is a polymorphic relationship
      const isPolymorphic = joinDef.targetField
        ? Array.isArray(joinDef.targetField.relationTo)
        : false

      if (isPolymorphic) {
        // For polymorphic relationships, we need to match both relationTo and value
        whereQuery[`${dbFieldName}.relationTo`] = collectionSlug
        whereQuery[`${dbFieldName}.value`] = { $in: parentIDs }
      } else {
        // For regular relationships and polymorphic collection joins
        whereQuery[dbFieldName] = { $in: parentIDs }
      }

      // Build the sort parameters for the query
      const fields = useDrafts
        ? buildVersionCollectionFields(adapter.payload.config, targetConfig, true)
        : targetConfig.flattenedFields

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

      const projection = buildJoinProjection(dbFieldName, useDrafts, sort)

      const [results, dbCount] = await Promise.all([
        JoinModel.find(whereQuery, projection, {
          sort,
          ...(isPolymorphicJoin ? {} : { limit, skip }),
        }).lean(),
        isPolymorphicJoin ? Promise.resolve(0) : JoinModel.countDocuments(whereQuery),
      ])

      const count = isPolymorphicJoin ? results.length : dbCount

      transform({
        adapter,
        data: results,
        fields: useDrafts
          ? buildVersionCollectionFields(adapter.payload.config, targetConfig, false)
          : targetConfig.fields,
        operation: 'read',
      })

      // Return results with collection info for grouping
      return {
        collectionSlug: joinCollectionSlug,
        count,
        dbFieldName,
        results,
        sort,
        useDrafts,
      }
    })

    const collectionResults = await Promise.all(collectionPromises)

    // Group the results by parent ID
    const grouped: Record<
      string,
      {
        docs: Record<string, unknown>[]
        sort: Record<string, string>
      }
    > = {}

    let totalCount = 0
    for (const collectionResult of collectionResults) {
      if (!collectionResult) {
        continue
      }

      const { collectionSlug, count, dbFieldName, results, sort, useDrafts } = collectionResult

      totalCount += count

      for (const result of results) {
        if (useDrafts) {
          result.id = result.parent
        }

        const parentValues = getByPathWithArrays(result, dbFieldName) as (
          | { relationTo: string; value: number | string }
          | number
          | string
        )[]

        if (parentValues.length === 0) {
          continue
        }

        for (let parentValue of parentValues) {
          if (!parentValue) {
            continue
          }

          if (typeof parentValue === 'object') {
            parentValue = parentValue.value
          }

          const joinData = {
            relationTo: collectionSlug,
            value: result.id,
          }

          const parentKey = parentValue as string
          if (!grouped[parentKey]) {
            grouped[parentKey] = {
              docs: [],
              sort,
            }
          }

          // Always store the ObjectID reference in polymorphic format
          grouped[parentKey].docs.push({
            ...result,
            __joinData: joinData,
          })
        }
      }
    }

    for (const results of Object.values(grouped)) {
      results.docs.sort((a, b) => {
        for (const [fieldName, sortOrder] of Object.entries(results.sort)) {
          const sort = sortOrder === 'asc' ? 1 : -1
          const aValue = a[fieldName] as Date | number | string
          const bValue = b[fieldName] as Date | number | string
          if (aValue < bValue) {
            return -1 * sort
          }
          if (aValue > bValue) {
            return 1 * sort
          }
        }
        return 0
      })
      results.docs = results.docs.map(
        (doc) => (isPolymorphicJoin ? doc.__joinData : doc.id) as Record<string, unknown>,
      )
    }

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
      grouped,
      isPolymorphicJoin,
      joinQuery,
      limit,
      localizedJoinPath,
      page,
      skip,
      totalCount,
    }
  })

  // Wait for all join operations to complete
  const joinResults = await Promise.all(joinPromises)

  // Process the results and attach them to documents
  for (const joinResult of joinResults) {
    if (!joinResult) {
      continue
    }

    const { grouped, isPolymorphicJoin, joinQuery, limit, localizedJoinPath, skip, totalCount } =
      joinResult

    // Attach the joined data to each parent document
    for (const doc of docs) {
      const id = (versions ? (doc.parent ?? doc._id ?? doc.id) : (doc._id ?? doc.id)) as string
      const all = grouped[id]?.docs || []

      // Calculate the slice for pagination
      // When limit is 0, it means unlimited - return all results
      const slice = isPolymorphicJoin
        ? limit === 0
          ? all
          : all.slice(skip, skip + limit)
        : // For non-polymorphic joins, we assume that page and limit were applied at the database level
          all

      // Create the join result object with pagination metadata
      const value: Record<string, unknown> = {
        docs: slice,
        hasNextPage: limit === 0 ? false : totalCount > skip + slice.length,
      }

      // Include total count if requested
      if (joinQuery.count) {
        value.totalDocs = totalCount
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
 * Builds projection for join queries
 */
function buildJoinProjection(
  baseFieldName: string,
  useDrafts: boolean,
  sort: Record<string, string>,
): Record<string, 1> {
  const projection: Record<string, 1> = {
    _id: 1,
    [baseFieldName]: 1,
  }

  if (useDrafts) {
    projection.parent = 1
  }

  for (const fieldName of Object.keys(sort)) {
    projection[fieldName] = 1
  }

  return projection
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
