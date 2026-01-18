import crypto from 'crypto';
import { UnauthorizedError } from 'payload';
import { createRequestFromPayloadRequest } from '../mcp/createRequest.js';
import { getMCPHandler } from '../mcp/getMcpHandler.js';
export const initializeMCPHandler = (pluginOptions)=>{
    const mcpHandler = async (req)=>{
        const { payload } = req;
        const MCPOptions = pluginOptions.mcp || {};
        const MCPHandlerOptions = MCPOptions.handlerOptions || {};
        const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false;
        req.payloadAPI = 'MCP';
        const getDefaultMcpAccessSettings = async (overrideApiKey)=>{
            const apiKey = overrideApiKey ?? req.headers.get('Authorization')?.startsWith('Bearer ') ? req.headers.get('Authorization')?.replace('Bearer ', '').trim() : null;
            if (apiKey === null) {
                throw new UnauthorizedError();
            }
            const sha256APIKeyIndex = crypto.createHmac('sha256', payload.secret).update(apiKey || '').digest('hex');
            const where = {
                apiKeyIndex: {
                    equals: sha256APIKeyIndex
                }
            };
            const { docs } = await payload.find({
                collection: 'payload-mcp-api-keys',
                depth: 1,
                limit: 1,
                pagination: false,
                where
            });
            if (docs.length === 0) {
                throw new UnauthorizedError();
            }
            if (useVerboseLogs) {
                payload.logger.info('[payload-mcp] API Key is valid');
            }
            const user = docs[0]?.user;
            user.collection = pluginOptions.userCollection;
            user._strategy = 'mcp-api-key';
            return docs[0];
        };
        const mcpAccessSettings = pluginOptions.overrideAuth ? await pluginOptions.overrideAuth(req, getDefaultMcpAccessSettings) : await getDefaultMcpAccessSettings();
        const handler = getMCPHandler(pluginOptions, mcpAccessSettings, req);
        const request = createRequestFromPayloadRequest(req);
        return await handler(request);
    };
    return mcpHandler;
};

//# sourceMappingURL=mcp.js.map