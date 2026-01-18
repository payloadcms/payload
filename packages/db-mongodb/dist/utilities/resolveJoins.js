import { appendVersionToQueryKey, buildVersionCollectionFields, combineQueries, getQueryDraftsSort } from 'payload';
import { fieldShouldBeLocalized } from 'payload/shared';
import { buildQuery } from '../queries/buildQuery.js';
import { buildSortParam } from '../queries/buildSortParam.js';
import { transform } from './transform.js';
/**
 * Resolves join relationships for a collection of documents.
 * This function fetches related documents based on join configurations and
 * attaches them to the original documents with pagination support.
 */ export async function resolveJoins({ adapter, collectionSlug, docs, joins, locale, projection, versions = false }) {
    // Early return if no joins are specified or no documents to process
    if (!joins || docs.length === 0) {
        return;
    }
    // Get the collection configuration from the adapter
    const collectionConfig = adapter.payload.collections[collectionSlug]?.config;
    if (!collectionConfig) {
        return;
    }
    // Build a map of join paths to their configurations for quick lookup
    // This flattens the nested join structure into a single map keyed by join path
    const joinMap = {};
    // Add regular joins
    for (const [target, joinList] of Object.entries(collectionConfig.joins)){
        for (const join of joinList){
            joinMap[join.joinPath] = {
                ...join,
                targetCollection: target
            };
        }
    }
    // Add polymorphic joins
    for (const join of collectionConfig.polymorphicJoins || []){
        // For polymorphic joins, we use the collections array as the target
        joinMap[join.joinPath] = {
            ...join,
            targetCollection: join.field.collection
        };
    }
    // Process each requested join concurrently
    const joinPromises = Object.entries(joins).map(async ([joinPath, joinQuery])=>{
        if (!joinQuery) {
            return null;
        }
        // If a projection is provided, and the join path is not in the projection, skip it
        if (projection && !projection[joinPath]) {
            return null;
        }
        // Get the join definition from our map
        const joinDef = joinMap[joinPath];
        if (!joinDef) {
            return null;
        }
        // Normalize collections to always be an array for unified processing
        const allCollections = Array.isArray(joinDef.field.collection) ? joinDef.field.collection : [
            joinDef.field.collection
        ];
        // Use the provided locale or fall back to the default locale for localized fields
        const localizationConfig = adapter.payload.config.localization;
        const effectiveLocale = locale || typeof localizationConfig === 'object' && localizationConfig && localizationConfig.defaultLocale;
        // Extract relationTo filter from the where clause to determine which collections to query
        const relationToFilter = extractRelationToFilter(joinQuery.where || {});
        // Determine which collections to query based on relationTo filter
        const collections = relationToFilter ? allCollections.filter((col)=>relationToFilter.includes(col)) : allCollections;
        // Check if this is a polymorphic collection join (where field.collection is an array)
        const isPolymorphicJoin = Array.isArray(joinDef.field.collection);
        // Apply pagination settings
        const limit = joinQuery.limit ?? joinDef.field.defaultLimit ?? 10;
        const page = joinQuery.page ?? 1;
        const skip = (page - 1) * limit;
        // Process collections concurrently
        const collectionPromises = collections.map(async (joinCollectionSlug)=>{
            const targetConfig = adapter.payload.collections[joinCollectionSlug]?.config;
            if (!targetConfig) {
                return null;
            }
            const useDrafts = versions && Boolean(targetConfig.versions?.drafts);
            let JoinModel;
            if (useDrafts) {
                JoinModel = adapter.versions[targetConfig.slug];
            } else {
                JoinModel = adapter.collections[targetConfig.slug];
            }
            if (!JoinModel) {
                return null;
            }
            // Extract all parent document IDs to use in the join query
            const parentIDs = docs.map((d)=>versions ? d.parent ?? d._id ?? d.id : d._id ?? d.id);
            // Build the base query
            let whereQuery = null;
            whereQuery = isPolymorphicJoin ? filterWhereForCollection(joinQuery.where || {}, targetConfig.flattenedFields, true) : joinQuery.where || {};
            // Skip this collection if the WHERE clause cannot be satisfied for polymorphic collection joins
            if (whereQuery === null) {
                return null;
            }
            whereQuery = useDrafts ? await JoinModel.buildQuery({
                locale,
                payload: adapter.payload,
                where: combineQueries(appendVersionToQueryKey(whereQuery), {
                    latest: {
                        equals: true
                    }
                })
            }) : await buildQuery({
                adapter,
                collectionSlug: joinCollectionSlug,
                fields: targetConfig.flattenedFields,
                locale,
                where: whereQuery
            });
            // Handle localized paths and version prefixes
            let dbFieldName = joinDef.field.on;
            if (effectiveLocale && typeof localizationConfig === 'object' && localizationConfig) {
                const pathSegments = joinDef.field.on.split('.');
                const transformedSegments = [];
                const fields = useDrafts ? buildVersionCollectionFields(adapter.payload.config, targetConfig, true) : targetConfig.flattenedFields;
                for(let i = 0; i < pathSegments.length; i++){
                    const segment = pathSegments[i];
                    transformedSegments.push(segment);
                    // Check if this segment corresponds to a localized field
                    const fieldAtSegment = fields.find((f)=>f.name === segment);
                    if (fieldAtSegment && fieldAtSegment.localized) {
                        transformedSegments.push(effectiveLocale);
                    }
                }
                dbFieldName = transformedSegments.join('.');
            }
            // Add version prefix for draft queries
            if (useDrafts) {
                dbFieldName = `version.${dbFieldName}`;
            }
            // Check if the target field is a polymorphic relationship
            const isPolymorphic = joinDef.targetField ? Array.isArray(joinDef.targetField.relationTo) : false;
            if (isPolymorphic) {
                // For polymorphic relationships, we need to match both relationTo and value
                whereQuery[`${dbFieldName}.relationTo`] = collectionSlug;
                whereQuery[`${dbFieldName}.value`] = {
                    $in: parentIDs
                };
            } else {
                // For regular relationships and polymorphic collection joins
                whereQuery[dbFieldName] = {
                    $in: parentIDs
                };
            }
            // Build the sort parameters for the query
            const fields = useDrafts ? buildVersionCollectionFields(adapter.payload.config, targetConfig, true) : targetConfig.flattenedFields;
            const sort = buildSortParam({
                adapter,
                config: adapter.payload.config,
                fields,
                locale,
                sort: useDrafts ? getQueryDraftsSort({
                    collectionConfig: targetConfig,
                    sort: joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort
                }) : joinQuery.sort || joinDef.field.defaultSort || targetConfig.defaultSort,
                timestamps: true
            });
            const projection = buildJoinProjection(dbFieldName, useDrafts, sort);
            const [results, dbCount] = await Promise.all([
                JoinModel.find(whereQuery, projection, {
                    sort,
                    ...isPolymorphicJoin ? {} : {
                        limit,
                        skip
                    }
                }).lean(),
                isPolymorphicJoin ? Promise.resolve(0) : JoinModel.countDocuments(whereQuery)
            ]);
            const count = isPolymorphicJoin ? results.length : dbCount;
            transform({
                adapter,
                data: results,
                fields: useDrafts ? buildVersionCollectionFields(adapter.payload.config, targetConfig, false) : targetConfig.fields,
                operation: 'read'
            });
            // Return results with collection info for grouping
            return {
                collectionSlug: joinCollectionSlug,
                count,
                dbFieldName,
                results,
                sort,
                useDrafts
            };
        });
        const collectionResults = await Promise.all(collectionPromises);
        // Group the results by parent ID
        const grouped = {};
        let totalCount = 0;
        for (const collectionResult of collectionResults){
            if (!collectionResult) {
                continue;
            }
            const { collectionSlug, count, dbFieldName, results, sort, useDrafts } = collectionResult;
            totalCount += count;
            for (const result of results){
                if (useDrafts) {
                    result.id = result.parent;
                }
                const parentValues = getByPathWithArrays(result, dbFieldName);
                if (parentValues.length === 0) {
                    continue;
                }
                for (let parentValue of parentValues){
                    if (!parentValue) {
                        continue;
                    }
                    if (typeof parentValue === 'object') {
                        parentValue = parentValue.value;
                    }
                    const joinData = {
                        relationTo: collectionSlug,
                        value: result.id
                    };
                    const parentKey = parentValue;
                    if (!grouped[parentKey]) {
                        grouped[parentKey] = {
                            docs: [],
                            sort
                        };
                    }
                    // Always store the ObjectID reference in polymorphic format
                    grouped[parentKey].docs.push({
                        ...result,
                        __joinData: joinData
                    });
                }
            }
        }
        for (const results of Object.values(grouped)){
            results.docs.sort((a, b)=>{
                for (const [fieldName, sortOrder] of Object.entries(results.sort)){
                    const sort = sortOrder === 'asc' ? 1 : -1;
                    const aValue = a[fieldName];
                    const bValue = b[fieldName];
                    if (aValue < bValue) {
                        return -1 * sort;
                    }
                    if (aValue > bValue) {
                        return 1 * sort;
                    }
                }
                return 0;
            });
            results.docs = results.docs.map((doc)=>isPolymorphicJoin ? doc.__joinData : doc.id);
        }
        // Determine if the join field should be localized
        const localeSuffix = fieldShouldBeLocalized({
            field: joinDef.field,
            parentIsLocalized: joinDef.parentIsLocalized
        }) && adapter.payload.config.localization && effectiveLocale ? `.${effectiveLocale}` : '';
        // Adjust the join path with locale suffix if needed
        const localizedJoinPath = `${joinPath}${localeSuffix}`;
        return {
            grouped,
            isPolymorphicJoin,
            joinQuery,
            limit,
            localizedJoinPath,
            page,
            skip,
            totalCount
        };
    });
    // Wait for all join operations to complete
    const joinResults = await Promise.all(joinPromises);
    // Process the results and attach them to documents
    for (const joinResult of joinResults){
        if (!joinResult) {
            continue;
        }
        const { grouped, isPolymorphicJoin, joinQuery, limit, localizedJoinPath, skip, totalCount } = joinResult;
        // Attach the joined data to each parent document
        for (const doc of docs){
            const id = versions ? doc.parent ?? doc._id ?? doc.id : doc._id ?? doc.id;
            const all = grouped[id]?.docs || [];
            // Calculate the slice for pagination
            // When limit is 0, it means unlimited - return all results
            const slice = isPolymorphicJoin ? limit === 0 ? all : all.slice(skip, skip + limit) : all;
            // Create the join result object with pagination metadata
            const value = {
                docs: slice,
                hasNextPage: limit === 0 ? false : totalCount > skip + slice.length
            };
            // Include total count if requested
            if (joinQuery.count) {
                value.totalDocs = totalCount;
            }
            // Navigate to the correct nested location in the document and set the join data
            // This handles nested join paths like "user.posts" by creating intermediate objects
            const segments = localizedJoinPath.split('.');
            let ref;
            if (versions) {
                if (!doc.version) {
                    doc.version = {};
                }
                ref = doc.version;
            } else {
                ref = doc;
            }
            for(let i = 0; i < segments.length - 1; i++){
                const seg = segments[i];
                if (!ref[seg]) {
                    ref[seg] = {};
                }
                ref = ref[seg];
            }
            // Set the final join data at the target path
            ref[segments[segments.length - 1]] = value;
        }
    }
}
/**
 * Extracts relationTo filter values from a WHERE clause
 *
 * @purpose When you have a polymorphic join field that can reference multiple collection types (e.g. the documentsAndFolders join field on
 * folders that points to all folder-enabled collections), Payload needs to decide which collections to actually query. Without filtering,
 * it would query ALL possible collections even when the WHERE clause clearly indicates it only needs specific ones.
 *
 * extractRelationToFilter analyzes the WHERE clause to extract relationTo conditions and returns only the collection slugs that
 * could possibly match, avoiding unnecessary database queries.
 *
 * @description The function recursively traverses a WHERE clause looking for relationTo conditions in these patterns:
 *
 * 1. Direct conditions: { relationTo: { equals: 'posts' } }
 * 2. IN conditions: { relationTo: { in: ['posts', 'media'] } }
 * 3. Nested in AND/OR: Recursively searches through logical operators

 * @param where - The WHERE clause to search
 * @returns Array of collection slugs if relationTo filter found, null otherwise
 */ function extractRelationToFilter(where) {
    if (!where || typeof where !== 'object') {
        return null;
    }
    // Check for direct relationTo conditions
    if (where.relationTo && typeof where.relationTo === 'object') {
        const relationTo = where.relationTo;
        if (relationTo.in && Array.isArray(relationTo.in)) {
            return relationTo.in;
        }
        if (relationTo.equals) {
            return [
                relationTo.equals
            ];
        }
    }
    // Check for relationTo in logical operators
    if (where.and && Array.isArray(where.and)) {
        const allResults = [];
        for (const condition of where.and){
            const result = extractRelationToFilter(condition);
            if (result) {
                allResults.push(...result);
            }
        }
        if (allResults.length > 0) {
            return [
                ...new Set(allResults)
            ] // Remove duplicates
            ;
        }
    }
    if (where.or && Array.isArray(where.or)) {
        const allResults = [];
        for (const condition of where.or){
            const result = extractRelationToFilter(condition);
            if (result) {
                allResults.push(...result);
            }
        }
        if (allResults.length > 0) {
            return [
                ...new Set(allResults)
            ] // Remove duplicates
            ;
        }
    }
    return null;
}
/**
 * Filters a WHERE clause to only include fields that exist in the target collection
 * This is needed for polymorphic joins where different collections have different fields
 * @param where - The original WHERE clause
 * @param availableFields - The fields available in the target collection
 * @param excludeRelationTo - Whether to exclude relationTo field (for individual collections)
 * @returns A filtered WHERE clause, or null if the query cannot match this collection
 */ function filterWhereForCollection(where, availableFields, excludeRelationTo = false) {
    if (!where || typeof where !== 'object') {
        return where;
    }
    const fieldNames = new Set(availableFields.map((f)=>f.name));
    // Add special fields that are available in polymorphic relationships
    if (!excludeRelationTo) {
        fieldNames.add('relationTo');
    }
    const filtered = {};
    for (const [key, value] of Object.entries(where)){
        if (key === 'and') {
            // Handle AND operator - all conditions must be satisfiable
            if (Array.isArray(value)) {
                const filteredConditions = [];
                for (const condition of value){
                    const filteredCondition = filterWhereForCollection(condition, availableFields, excludeRelationTo);
                    // If any condition in AND cannot be satisfied, the whole AND fails
                    if (filteredCondition === null) {
                        return null;
                    }
                    if (Object.keys(filteredCondition).length > 0) {
                        filteredConditions.push(filteredCondition);
                    }
                }
                if (filteredConditions.length > 0) {
                    filtered[key] = filteredConditions;
                }
            }
        } else if (key === 'or') {
            // Handle OR operator - at least one condition must be satisfiable
            if (Array.isArray(value)) {
                const filteredConditions = value.map((condition)=>filterWhereForCollection(condition, availableFields, excludeRelationTo)).filter((condition)=>condition !== null && Object.keys(condition).length > 0);
                if (filteredConditions.length > 0) {
                    filtered[key] = filteredConditions;
                }
            // If no OR conditions can be satisfied, we still continue (OR is more permissive)
            }
        } else if (key === 'relationTo' && excludeRelationTo) {
            continue;
        } else if (fieldNames.has(key)) {
            // Include the condition if the field exists in this collection
            filtered[key] = value;
        } else {
            // Field doesn't exist in this collection - this makes the query unsatisfiable
            return null;
        }
    }
    return filtered;
}
/**
 * Builds projection for join queries
 */ function buildJoinProjection(baseFieldName, useDrafts, sort) {
    const projection = {
        _id: 1,
        [baseFieldName]: 1
    };
    if (useDrafts) {
        projection.parent = 1;
    }
    for (const fieldName of Object.keys(sort)){
        projection[fieldName] = 1;
    }
    return projection;
}
/**
 * Enhanced utility function to safely traverse nested object properties using dot notation
 * Handles arrays by searching through array elements for matching values
 * @param doc - The document to traverse
 * @param path - Dot-separated path (e.g., "array.category")
 * @returns Array of values found at the specified path (for arrays) or single value
 */ function getByPathWithArrays(doc, path) {
    const segments = path.split('.');
    let current = doc;
    for(let i = 0; i < segments.length; i++){
        const segment = segments[i];
        if (current === undefined || current === null) {
            return [];
        }
        // Get the value at the current segment
        const value = current[segment];
        if (value === undefined || value === null) {
            return [];
        }
        // If this is the last segment, return the value(s)
        if (i === segments.length - 1) {
            return Array.isArray(value) ? value : [
                value
            ];
        }
        // If the value is an array and we have more segments to traverse
        if (Array.isArray(value)) {
            const remainingPath = segments.slice(i + 1).join('.');
            const results = [];
            // Search through each array element
            for (const item of value){
                if (item && typeof item === 'object') {
                    const subResults = getByPathWithArrays(item, remainingPath);
                    results.push(...subResults);
                }
            }
            return results;
        }
        // Continue traversing
        current = value;
    }
    return [];
}

//# sourceMappingURL=resolveJoins.js.map