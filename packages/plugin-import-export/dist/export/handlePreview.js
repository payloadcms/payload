import { addDataAndFileToRequest } from 'payload';
import { DEFAULT_PREVIEW_LIMIT, MAX_PREVIEW_LIMIT, MIN_PREVIEW_LIMIT, MIN_PREVIEW_PAGE } from '../constants.js';
import { flattenObject } from '../utilities/flattenObject.js';
import { getExportFieldFunctions } from '../utilities/getExportFieldFunctions.js';
import { getFlattenedFieldKeys } from '../utilities/getFlattenedFieldKeys.js';
import { getSchemaColumns } from '../utilities/getSchemaColumns.js';
import { getSelect } from '../utilities/getSelect.js';
import { getValueAtPath } from '../utilities/getvalueAtPath.js';
import { removeDisabledFields } from '../utilities/removeDisabledFields.js';
import { setNestedValue } from '../utilities/setNestedValue.js';
export const handlePreview = async (req)=>{
    await addDataAndFileToRequest(req);
    const { collectionSlug, draft: draftFromReq, fields, limit: exportLimit, locale, previewLimit: rawPreviewLimit = DEFAULT_PREVIEW_LIMIT, previewPage: rawPreviewPage = 1, sort, where: whereFromReq = {} } = req.data;
    // Validate and clamp pagination values to safe bounds
    const previewLimit = Math.max(MIN_PREVIEW_LIMIT, Math.min(rawPreviewLimit, MAX_PREVIEW_LIMIT));
    const previewPage = Math.max(MIN_PREVIEW_PAGE, rawPreviewPage);
    const targetCollection = req.payload.collections[collectionSlug];
    if (!targetCollection) {
        return Response.json({
            error: `Collection with slug ${collectionSlug} not found`
        }, {
            status: 400
        });
    }
    const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined;
    const draft = draftFromReq === 'yes';
    const collectionHasVersions = Boolean(targetCollection.config.versions);
    // Only filter by _status for versioned collections
    const publishedWhere = collectionHasVersions ? {
        _status: {
            equals: 'published'
        }
    } : {};
    const where = {
        and: [
            whereFromReq,
            draft ? {} : publishedWhere
        ]
    };
    // Count total docs matching export criteria
    const countResult = await req.payload.count({
        collection: collectionSlug,
        overrideAccess: false,
        req,
        where
    });
    const totalMatchingDocs = countResult.totalDocs;
    // Calculate actual export count (respecting export limit)
    const exportTotalDocs = exportLimit && exportLimit > 0 ? Math.min(totalMatchingDocs, exportLimit) : totalMatchingDocs;
    // Calculate preview pagination that respects export limit
    // Preview should only show docs that will actually be exported
    const previewStartIndex = (previewPage - 1) * previewLimit;
    // Calculate pagination info based on export limit (not raw DB results)
    const previewTotalPages = exportTotalDocs === 0 ? 0 : Math.ceil(exportTotalDocs / previewLimit);
    const isCSV = req?.data?.format === 'csv';
    // Get locale codes for locale expansion when locale='all'
    const localeCodes = locale === 'all' && req.payload.config.localization ? req.payload.config.localization.localeCodes : undefined;
    // Get disabled fields configuration
    const disabledFields = targetCollection.config.admin?.custom?.['plugin-import-export']?.disabledFields ?? [];
    // Always compute columns for CSV (even if no docs) for consistent schema
    const columns = isCSV ? getSchemaColumns({
        collectionConfig: targetCollection.config,
        disabledFields,
        fields,
        locale: locale ?? undefined,
        localeCodes
    }) : undefined;
    // If we're beyond the export limit, return empty docs with columns
    if (exportLimit && exportLimit > 0 && previewStartIndex >= exportLimit) {
        const response = {
            columns,
            docs: [],
            exportTotalDocs,
            hasNextPage: false,
            hasPrevPage: previewPage > 1,
            limit: previewLimit,
            page: previewPage,
            totalDocs: exportTotalDocs,
            totalPages: previewTotalPages
        };
        return Response.json(response);
    }
    // Fetch preview page with full previewLimit to maintain consistent pagination offsets
    // We'll trim the results afterwards if needed to respect export limit
    const result = await req.payload.find({
        collection: collectionSlug,
        depth: 1,
        draft,
        limit: previewLimit,
        locale,
        overrideAccess: false,
        page: previewPage,
        req,
        select,
        sort,
        where
    });
    // Trim docs to respect export limit boundary
    let docs = result.docs;
    if (exportLimit && exportLimit > 0) {
        const remainingInExport = exportLimit - previewStartIndex;
        if (remainingInExport < docs.length) {
            docs = docs.slice(0, remainingInExport);
        }
    }
    // Transform docs based on format
    let transformed;
    if (isCSV) {
        const toCSVFunctions = getExportFieldFunctions({
            fields: targetCollection.config.fields
        });
        const possibleKeys = getFlattenedFieldKeys(targetCollection.config.fields, '', {
            localeCodes
        });
        transformed = docs.map((doc)=>{
            const row = flattenObject({
                doc,
                fields,
                toCSVFunctions
            });
            for (const key of possibleKeys){
                if (!(key in row)) {
                    row[key] = null;
                }
            }
            return row;
        });
    } else {
        transformed = docs.map((doc)=>{
            let output = {
                ...doc
            };
            // Remove disabled fields first
            output = removeDisabledFields(output, disabledFields);
            // Then trim to selected fields only (if fields are provided)
            if (Array.isArray(fields) && fields.length > 0) {
                const trimmed = {};
                for (const key of fields){
                    const value = getValueAtPath(output, key);
                    setNestedValue(trimmed, key, value ?? null);
                }
                output = trimmed;
            }
            return output;
        });
    }
    const hasNextPage = previewPage < previewTotalPages;
    const hasPrevPage = previewPage > 1;
    const response = {
        columns,
        docs: transformed,
        exportTotalDocs,
        hasNextPage,
        hasPrevPage,
        limit: previewLimit,
        page: previewPage,
        totalDocs: exportTotalDocs,
        totalPages: previewTotalPages
    };
    return Response.json(response);
};

//# sourceMappingURL=handlePreview.js.map