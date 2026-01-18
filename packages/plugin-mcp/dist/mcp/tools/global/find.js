import { toCamelCase } from '../../../utils/camelCase.js';
import { toolSchemas } from '../schemas.js';
export const findGlobalTool = (server, req, user, verboseLogs, globalSlug, globals)=>{
    const tool = async (depth = 0, locale, fallbackLocale)=>{
        const payload = req.payload;
        if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Reading global: ${globalSlug}, depth: ${depth}${locale ? `, locale: ${locale}` : ''}`);
        }
        try {
            const findOptions = {
                slug: globalSlug,
                depth,
                user
            };
            // Add locale parameters if provided
            if (locale) {
                findOptions.locale = locale;
            }
            if (fallbackLocale) {
                findOptions.fallbackLocale = fallbackLocale;
            }
            const result = await payload.findGlobal(findOptions);
            if (verboseLogs) {
                payload.logger.info(`[payload-mcp] Found global: ${globalSlug}`);
            }
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `Global "${globalSlug}":
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``
                    }
                ]
            };
            return globals?.[globalSlug]?.overrideResponse?.(response, result, req) || response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            payload.logger.error(`[payload-mcp] Error reading global ${globalSlug}: ${errorMessage}`);
            const response = {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Error reading global "${globalSlug}":** ${errorMessage}`
                    }
                ]
            };
            return globals?.[globalSlug]?.overrideResponse?.(response, {}, req) || response;
        }
    };
    if (globals?.[globalSlug]?.enabled) {
        server.tool(`find${globalSlug.charAt(0).toUpperCase() + toCamelCase(globalSlug).slice(1)}`, `${toolSchemas.findGlobal.description.trim()}\n\n${globals?.[globalSlug]?.description || ''}`, toolSchemas.findGlobal.parameters.shape, async ({ depth, fallbackLocale, locale })=>{
            return await tool(depth, locale, fallbackLocale);
        });
    }
};

//# sourceMappingURL=find.js.map