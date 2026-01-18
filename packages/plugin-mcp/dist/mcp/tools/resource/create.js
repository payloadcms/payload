import { z } from 'zod';
import { toCamelCase } from '../../../utils/camelCase.js';
import { convertCollectionSchemaToZod } from '../../../utils/convertCollectionSchemaToZod.js';
import { toolSchemas } from '../schemas.js';
export const createResourceTool = (server, req, user, verboseLogs, collectionSlug, collections, schema)=>{
    const tool = async (data, depth = 0, draft, locale, fallbackLocale)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Creating resource in collection: ${collectionSlug}${locale ? ` with locale: ${locale}` : ''}`);
        }
        try {
            // Parse the data JSON
            let parsedData;
            try {
                parsedData = JSON.parse(data);
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Parsed data for ${collectionSlug}: ${JSON.stringify(parsedData)}`);
                }
            } catch (_parseError) {
                payload.logger.error(`[payload-mcp] Invalid JSON data provided: ${data}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Error: Invalid JSON data provided'
                        }
                    ]
                };
            }
            // Create the resource
            const result = await payload.create({
                collection: collectionSlug,
                data: parsedData,
                depth,
                draft,
                overrideAccess: false,
                req,
                user,
                ...locale && {
                    locale
                },
                ...fallbackLocale && {
                    fallbackLocale
                }
            });
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Successfully created resource in ${collectionSlug} with ID: ${result.id}`);
            }
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `Resource created successfully in collection "${collectionSlug}"!
Created resource:
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``
                    }
                ]
            };
            return collections?.[collectionSlug]?.overrideResponse?.(response, result, req) || response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error creating resource in ${collectionSlug}: ${errorMessage}`);
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `Error creating resource in collection "${collectionSlug}": ${errorMessage}`
                    }
                ]
            };
            return collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response;
        }
    };
    if (collections?.[collectionSlug]?.enabled) {
        const convertedFields = convertCollectionSchemaToZod(schema);
        // Create a new schema that combines the converted fields with create-specific parameters
        const createResourceSchema = z.object({
            ...convertedFields.shape,
            depth: z.number().int().min(0).max(10).optional().default(0).describe('How many levels deep to populate relationships in response'),
            draft: z.boolean().optional().default(false).describe('Whether to create the document as a draft'),
            fallbackLocale: z.string().optional().describe('Optional: fallback locale code to use when requested locale is not available'),
            locale: z.string().optional().describe('Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale')
        });
        server.tool(`create${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`, `${collections?.[collectionSlug]?.description || toolSchemas.createResource.description.trim()}`, createResourceSchema.shape, async (params)=>{
            const { depth, draft, fallbackLocale, locale, ...fieldData } = params;
            const data = JSON.stringify(fieldData);
            return await tool(data, depth, draft, locale, fallbackLocale);
        });
    }
};

//# sourceMappingURL=create.js.map