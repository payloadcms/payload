import type { JoinQuery, SanitizedJoins } from 'payload'

import { fieldShouldBeLocalized } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'
import { transform } from './transform.js'

/**
 * Extracts relationTo filter values from a WHERE clause
 * @param where - The WHERE clause to search
 * @returns Array of collection slugs if relationTo filter found, null otherwise
 */
function extractRelationToFilter(where: Record<string, any>): null | string[] {
  if (!where || typeof where !== 'object') {
    return null
  }

  // Check for direct relationTo conditions
  if (where.relationTo) {
    if (where.relationTo.in && Array.isArray(where.relationTo.in)) {
      return where.relationTo.in
    }
    if (where.relationTo.equals) {
      return [where.relationTo.equals]
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
 * @returns A filtered WHERE clause
 */
function filterWhereForCollection(
  where: Record<string, any>,
  availableFields: any[],
  excludeRelationTo: boolean = false,
): Record<string, any> {
  if (!where || typeof where !== 'object') {
    return where
  }

  const fieldNames = new Set(availableFields.map((f) => f.name))
  // Add special fields that are available in polymorphic relationships
  if (!excludeRelationTo) {
    fieldNames.add('relationTo')
  }

  const filtered: Record<string, any> = {}

  for (const [key, value] of Object.entries(where)) {
    if (key === 'and' || key === 'or') {
      // Handle logical operators by recursively filtering their conditions
      if (Array.isArray(value)) {
        const filteredConditions = value
          .map((condition) =>
            filterWhereForCollection(condition, availableFields, excludeRelationTo),
          )
          .filter((condition) => Object.keys(condition).length > 0) // Remove empty conditions

        if (filteredConditions.length > 0) {
          filtered[key] = filteredConditions
        }
      }
    } else if (key === 'relationTo' && excludeRelationTo) {
      // Skip relationTo field for non-polymorphic collections
      continue
    } else if (fieldNames.has(key)) {
      // Include the condition if the field exists in this collection
      filtered[key] = value
    }
    // Skip conditions for fields that don't exist in this collection
  }

  return filtered
}

type Args = {
  adapter: MongooseAdapter
  collectionSlug: string
  docs: Record<string, unknown>[]
  joins?: JoinQuery
  locale?: string
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

/**
 * Resolves join relationships for a collection of documents.
 * This function fetches related documents based on join configurations and
 * attaches them to the original documents with pagination support.
 *
 * @param adapter - The MongoDB adapter instance
 * @param collectionSlug - The slug of the collection being queried
 * @param docs - Array of documents to resolve joins for
 * @param joins - Join query specifications (which joins to resolve and how)
 * @param locale - Optional locale for localized queries
 */
export async function resolveJoins({
  adapter,
  collectionSlug,
  docs,
  joins,
  locale,
}: Args): Promise<void> {
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
    joinMap[join.joinPath] = { ...join, targetCollection: join.field.collection as any }
  }

  // Process each requested join
  for (const [joinPath, joinQuery] of Object.entries(joins)) {
    if (!joinQuery) {
      continue
    }

    // Get the join definition from our map
    const joinDef = joinMap[joinPath]
    if (!joinDef) {
      continue
    }

    // Check if this is a polymorphic collection join (where field.collection is an array)
    const isPolymorphicCollectionJoin = Array.isArray(joinDef.field.collection)

    if (isPolymorphicCollectionJoin) {
      // Handle polymorphic collection joins (like documentsAndFolders from folder system)
      // These joins span multiple collections, so we need to query each collection separately
      const allCollections = joinDef.field.collection as string[]
      const allResults: Record<string, unknown>[] = []

      // Extract all parent document IDs to use in the join query
      const parentIDs = docs.map((d) => d._id ?? d.id)

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

      // Query each collection in the polymorphic join
      for (const collectionSlug of collections) {
        const targetConfig = adapter.payload.collections[collectionSlug]?.config
        const JoinModel = adapter.collections[collectionSlug]
        if (!targetConfig || !JoinModel) {
          continue
        }

        // Filter WHERE clause to only include fields that exist in this collection
        // For polymorphic collection joins, we exclude relationTo from individual collections
        // since relationTo is metadata added after fetching, not a real field in collections
        const filteredWhere = filterWhereForCollection(
          joinQuery.where || {},
          targetConfig.flattenedFields,
          true, // exclude relationTo field for individual collections in polymorphic joins
        )

        // For polymorphic collection joins, we should not skip collections just because
        // some AND conditions were filtered out - the relationTo filter is what determines
        // if a collection should participate in the join
        // Only skip if there are literally no conditions after filtering
        if (Object.keys(filteredWhere).length === 0) {
          continue
        }

        // Build the base query for this specific collection
        const whereQuery = await buildQuery({
          adapter,
          collectionSlug,
          fields: targetConfig.flattenedFields,
          locale,
          where: filteredWhere,
        })

        // Add the join condition
        whereQuery[joinDef.field.on] = { $in: parentIDs }

        // Build the sort parameters for the query
        const sort = buildSortParam({
          adapter,
          config: adapter.payload.config,
          fields: targetConfig.flattenedFields,
          locale,
          sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
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

        // Execute the query to get results from this collection
        const results = await JoinModel.find(whereQuery, null).sort(mongooseSort).lean()

        // Transform the results and add relationTo metadata
        transform({
          adapter,
          data: results,
          fields: targetConfig.fields,
          operation: 'read',
        })

        // Add relationTo field to each result to indicate which collection it came from
        for (const result of results) {
          result.relationTo = collectionSlug
          allResults.push(result)
        }
      }

      // Group the results by their parent document ID
      const grouped: Record<string, Record<string, unknown>[]> = {}

      for (const res of allResults) {
        // Get the parent ID from the result using the join field
        const parentValue = getByPath(res, joinDef.field.on)
        if (!parentValue) {
          continue
        }

        const parentKey = parentValue as string
        if (!grouped[parentKey]) {
          grouped[parentKey] = []
        }
        grouped[parentKey].push(res)
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

      // Attach the joined data to each parent document
      for (const doc of docs) {
        const id = (doc._id ?? doc.id) as string
        const all = grouped[id] || []

        // Calculate the slice for pagination
        const slice = all.slice((page - 1) * limit, (page - 1) * limit + limit)

        // Create the join result object with pagination metadata
        const value: Record<string, unknown> = {
          docs: slice,
          hasNextPage: all.length > (page - 1) * limit + slice.length,
        }

        // Include total count if requested
        if (joinQuery.count) {
          value.totalDocs = all.length
        }

        // Navigate to the correct nested location in the document and set the join data
        const segments = localizedJoinPath.split('.')
        let ref = doc
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

      continue
    }

    // Handle regular joins (including regular polymorphic joins)
    const targetConfig = adapter.payload.collections[joinDef.field.collection as string]?.config
    const JoinModel = adapter.collections[joinDef.field.collection as string]
    if (!targetConfig || !JoinModel) {
      continue
    }

    // Extract all parent document IDs to use in the join query
    const parentIDs = docs.map((d) => d._id ?? d.id)

    // Build the base query for the target collection
    const whereQuery = await buildQuery({
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

    // Handle localized paths: transform 'localizedArray.category' to 'localizedArray.en.category'
    let dbFieldName = joinDef.field.on
    if (effectiveLocale && typeof localizationConfig === 'object' && localizationConfig) {
      const pathSegments = joinDef.field.on.split('.')
      const transformedSegments: string[] = []

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i]!
        transformedSegments.push(segment)

        // Check if this segment corresponds to a localized field
        const fieldAtSegment = targetConfig.flattenedFields.find((f) => f.name === segment)
        if (fieldAtSegment && fieldAtSegment.localized) {
          transformedSegments.push(effectiveLocale)
        }
      }

      dbFieldName = transformedSegments.join('.')
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
      fields: targetConfig.flattenedFields,
      locale,
      sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
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
    transform({
      adapter,
      data: results,
      fields: targetConfig.fields,
      operation: 'read',
    })

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

      for (const parent of parents) {
        if (!parent) {
          continue
        }
        const parentKey = parent as string
        if (!grouped[parentKey]) {
          grouped[parentKey] = []
        }
        grouped[parentKey].push(res)
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

    // Attach the joined data to each parent document
    for (const doc of docs) {
      const id = (doc._id ?? doc.id) as string
      const all = grouped[id] || []

      // Calculate the slice for pagination
      const slice = all.slice((page - 1) * limit, (page - 1) * limit + limit)

      // Create the join result object with pagination metadata
      const value: Record<string, unknown> = {
        docs: slice,
        hasNextPage: all.length > (page - 1) * limit + slice.length,
      }

      // Include total count if requested
      if (joinQuery.count) {
        value.totalDocs = all.length
      }

      // Navigate to the correct nested location in the document and set the join data
      // This handles nested join paths like "user.posts" by creating intermediate objects
      const segments = localizedJoinPath.split('.')
      let ref = doc
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
