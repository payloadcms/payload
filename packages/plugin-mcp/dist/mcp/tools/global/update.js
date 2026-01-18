import { z } from 'zod';
import { toCamelCase } from '../../../utils/camelCase.js';
import { convertCollectionSchemaToZod } from '../../../utils/convertCollectionSchemaToZod.js';
import { toolSchemas } from '../schemas.js';
export const updateGlobalTool = (server, req, user, verboseLogs, globalSlug, globals, schema)=>{
    const tool = async (data, draft = false, depth = 0, locale, fallbackLocale)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Updating global: ${globalSlug}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`);
        }
        try {
            // Parse the data JSON
            let parsedData;
            try {
                parsedData = JSON.parse(data);
                if (verboseLogs) {
                    payload.logger.info(`[payload-mcp] Parsed data for ${globalSlug}: ${JSON.stringify(parsedData)}`);
                }
            } catch (_parseError) {
                payload.logger.error(`[payload-mcp] Invalid JSON data provided: ${data}`);
                const response = {
                    content: [
                        {
                            type: 'text',
                            text: 'Error: Invalid JSON data provided'
                        }
                    ]
                };
                return globals?.[globalSlug]?.overrideResponse?.(response, {}, req) || response;
            }
            const updateOptions = {
                slug: globalSlug,
                data: parsedData,
                depth,
                draft,
                user
            };
            // Add locale parameters if provided
            if (locale) {
                updateOptions.locale = locale;
            }
            if (fallbackLocale) {
                updateOptions.fallbackLocale = fallbackLocale;
            }
            const result = await payload.updateGlobal(updateOptions);
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Successfully updated global: ${globalSlug}`);
            }
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `Global "${globalSlug}" updated successfully!
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``
                    }
                ]
            };
            return globals?.[globalSlug]?.overrideResponse?.(response, result, req) || response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error updating global ${globalSlug}: ${errorMessage}`);
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `Error updating global "${globalSlug}": ${errorMessage}`
                    }
                ]
            };
            return globals?.[globalSlug]?.overrideResponse?.(response, {}, req) || response;
        }
    };
    if (globals?.[globalSlug]?.enabled) {
        const convertedFields = convertCollectionSchemaToZod(schema);
        // Make all fields optional for partial updates (PATCH-style)
        const optionalFields = Object.fromEntries(Object.entries(convertedFields.shape).map(([key, value])=>[
                key,
                value.optional()
            ]));
        const updateGlobalSchema = z.object({
            ...optionalFields,
            depth: z.number().optional().describe('Optional: Depth of relationships to populate'),
            draft: z.boolean().optional().describe('Optional: Whether to save as draft (default: false)'),
            fallbackLocale: z.string().optional().describe('Optional: fallback locale code to use when requested locale is not available'),
            locale: z.string().optional().describe('Optional: locale code to update data in (e.g., "en", "es"). Use "all" to update all locales for localized fields')
        });
        server.tool(`update${globalSlug.charAt(0).toUpperCase() + toCamelCase(globalSlug).slice(1)}`, `${toolSchemas.updateGlobal.description.trim()}\n\n${globals?.[globalSlug]?.description || ''}`, updateGlobalSchema.shape, async (params)=>{
            const { depth, draft, fallbackLocale, locale, ...rest } = params;
            const data = JSON.stringify(rest);
            return await tool(data, draft, depth, locale, fallbackLocale);
        });
    }
};

//# sourceMappingURL=update.js.map