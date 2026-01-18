import { toCamelCase } from '../../../utils/camelCase.js';
import { toolSchemas } from '../schemas.js';
export const deleteResourceTool = (server, req, user, verboseLogs, collectionSlug, collections)=>{
    const tool = async (id, where, depth = 0, locale, fallbackLocale)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Deleting resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}${locale ? `, locale: ${locale}` : ''}`);
        }
        try {
            // Validate that either id or where is provided
            if (!id && !where) {
                payload.logger.error('[payload-mcp] Either id or where clause must be provided');
                const response = {
                    content: [
                        {
                            type: 'text',
                            text: 'Error: Either id or where clause must be provided'
                        }
                    ]
                };
                return collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response;
            }
            // Parse where clause if provided
            let whereClause = {};
            if (where) {
                try {
                    whereClause = JSON.parse(where);
                    if (verboseLogs) {
                        payload.logger.info(`[payload-mcp] Using where clause: ${where}`);
                    }
                } catch (_parseError) {
                    payload.logger.warn(`[payload-mcp] Invalid where clause JSON: ${where}`);
                    const response = {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: Invalid JSON in where clause'
                            }
                        ]
                    };
                    return collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response;
                }
            }
            // Build delete options
            const deleteOptions = {
                collection: collectionSlug,
                depth,
                overrideAccess: false,
                req,
                user,
                ...locale && {
                    locale
                },
                ...fallbackLocale && {
                    fallbackLocale
                }
            };
            // Delete by ID or where clause
            if (id) {
                deleteOptions.id = id;
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Deleting single document with ID: ${id}`);
                }
            } else {
                deleteOptions.where = whereClause;
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Deleting multiple documents with where clause`);
                }
            }
            const result = await payload.delete(deleteOptions);
            // Handle different result types
            if (id) {
                // Single document deletion
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Successfully deleted document with ID: ${id}`);
                }
                const response = {
                    content: [
                        {
                            type: 'text',
                            text: `Document deleted successfully from collection "${collectionSlug}"!
Deleted document:
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``
                        }
                    ]
                };
                return collections?.[collectionSlug]?.overrideResponse?.(response, result, req) || response;
            } else {
                // Multiple documents deletion
                const bulkResult = result;
                const docs = bulkResult.docs || [];
                const errors = bulkResult.errors || [];
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Successfully deleted ${docs.length} documents, ${errors.length} errors`);
                }
                let responseText = `Document deleted successfully from collection "${collectionSlug}"!
Deleted: ${docs.length} documents
Errors: ${errors.length}
---`;
                if (docs.length > 0) {
                    responseText += `\n\nDeleted documents:
\`\`\`json
${JSON.stringify(docs, null, 2)}
\`\`\``;
                }
                if (errors.length > 0) {
                    responseText += `\n\nErrors:
\`\`\`json
${JSON.stringify(errors, null, 2)}
\`\`\``;
                }
                const response = {
                    content: [
                        {
                            type: 'text',
                            text: responseText
                        }
                    ]
                };
                return collections?.[collectionSlug]?.overrideResponse?.(response, {
                    docs,
                    errors
                }, req) || response;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error deleting resource from ${collectionSlug}: ${errorMessage}`);
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `Error deleting resource from collection "${collectionSlug}": ${errorMessage}`
                    }
                ]
            };
            return collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response;
        }
    };
    if (collections?.[collectionSlug]?.enabled) {
        server.tool(`delete${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`, `${collections?.[collectionSlug]?.description || toolSchemas.deleteResource.description.trim()}`, toolSchemas.deleteResource.parameters.shape, async ({ id, depth, fallbackLocale, locale, where })=>{
            return await tool(id, where, depth, locale, fallbackLocale);
        });
    }
};

//# sourceMappingURL=delete.js.map