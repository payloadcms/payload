import { toCamelCase } from '../../../utils/camelCase.js';
import { toolSchemas } from '../schemas.js';
export const findResourceTool = (server, req, user, verboseLogs, collectionSlug, collections)=>{
    const tool = async (id, limit = 10, page = 1, sort, where, depth = 0, locale, fallbackLocale, draft)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Reading resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}${locale ? `, locale: ${locale}` : ''}`);
        }
        try {
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
            // If ID is provided, use findByID
            if (id) {
                try {
                    const doc = await payload.findByID({
                        id,
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
                        },
                        ...draft !== undefined && {
                            draft
                        }
                    });
                    if (verboseLogs) {
                        payload.logger.info(`[payload-mcp] Found document with ID: ${id}`);
                    }
                    const response = {
                        content: [
                            {
                                type: 'text',
                                text: `Resource from collection "${collectionSlug}":
${JSON.stringify(doc, null, 2)}`
                            }
                        ]
                    };
                    return collections?.[collectionSlug]?.overrideResponse?.(response, doc, req) || response;
                } catch (_findError) {
                    payload.logger.warn(`[payload-mcp] Document not found with ID: ${id} in collection: ${collectionSlug}`);
                    const response = {
                        content: [
                            {
                                type: 'text',
                                text: `Error: Document with ID "${id}" not found in collection "${collectionSlug}"`
                            }
                        ]
                    };
                    return collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response;
                }
            }
            // Otherwise, use find to get multiple documents
            const findOptions = {
                collection: collectionSlug,
                depth,
                limit,
                overrideAccess: false,
                page,
                req,
                user,
                ...locale && {
                    locale
                },
                ...fallbackLocale && {
                    fallbackLocale
                },
                ...draft !== undefined && {
                    draft
                }
            };
            if (sort) {
                findOptions.sort = sort;
            }
            if (Object.keys(whereClause).length > 0) {
                findOptions.where = whereClause;
            }
            const result = await payload.find(findOptions);
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Found ${result.docs.length} documents in collection: ${collectionSlug}`);
            }
            let responseText = `Collection: "${collectionSlug}"
Total: ${result.totalDocs} documents
Page: ${result.page} of ${result.totalPages}
`;
            for (const doc of result.docs){
                responseText += `\n\`\`\`json\n${JSON.stringify(doc, null, 2)}\n\`\`\``;
            }
            const response = {
                content: [
                    {
                        type: 'text',
                        text: responseText
                    }
                ]
            };
            return collections?.[collectionSlug]?.overrideResponse?.(response, result, req) || response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error reading resources from collection ${collectionSlug}: ${errorMessage}`);
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error reading resources from collection "${collectionSlug}":** ${errorMessage}`
                    }
                ]
            };
            return collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response;
        }
    };
    if (collections?.[collectionSlug]?.enabled) {
        server.tool(`find${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`, `${collections?.[collectionSlug]?.description || toolSchemas.findResources.description.trim()}`, toolSchemas.findResources.parameters.shape, async ({ id, depth, draft, fallbackLocale, limit, locale, page, sort, where })=>{
            return await tool(id, limit, page, sort, where, depth, locale, fallbackLocale, draft);
        });
    }
};

//# sourceMappingURL=find.js.map