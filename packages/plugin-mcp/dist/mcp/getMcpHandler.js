import { createMcpHandler } from '@vercel/mcp-adapter';
import { join } from 'path';
import { APIError, configToJSONSchema } from 'payload';
import { toCamelCase } from '../utils/camelCase.js';
import { getEnabledSlugs } from '../utils/getEnabledSlugs.js';
import { registerTool } from './registerTool.js';
// Tools
import { findGlobalTool } from './tools/global/find.js';
import { updateGlobalTool } from './tools/global/update.js';
import { createResourceTool } from './tools/resource/create.js';
import { deleteResourceTool } from './tools/resource/delete.js';
import { findResourceTool } from './tools/resource/find.js';
import { updateResourceTool } from './tools/resource/update.js';
// Experimental Tools
/**
 * @experimental This tools are experimental and may change or be removed in the future.
 */ import { authTool } from './tools/auth/auth.js';
import { forgotPasswordTool } from './tools/auth/forgotPassword.js';
import { loginTool } from './tools/auth/login.js';
import { resetPasswordTool } from './tools/auth/resetPassword.js';
import { unlockTool } from './tools/auth/unlock.js';
import { verifyTool } from './tools/auth/verify.js';
import { createCollectionTool } from './tools/collection/create.js';
import { deleteCollectionTool } from './tools/collection/delete.js';
import { findCollectionTool } from './tools/collection/find.js';
import { updateCollectionTool } from './tools/collection/update.js';
import { findConfigTool } from './tools/config/find.js';
import { updateConfigTool } from './tools/config/update.js';
import { createJobTool } from './tools/job/create.js';
import { runJobTool } from './tools/job/run.js';
import { updateJobTool } from './tools/job/update.js';
export const getMCPHandler = (pluginOptions, mcpAccessSettings, req)=>{
    const { payload } = req;
    const configSchema = configToJSONSchema(payload.config, payload.db.defaultIDType, req.i18n);
    // Handler wrapper that injects req before the _extra argument
    const wrapHandler = (handler)=>{
        return async (...args)=>{
            const _extra = args[args.length - 1];
            const handlerArgs = args.slice(0, -1);
            return await handler(...handlerArgs, req, _extra);
        };
    };
    const payloadToolHandler = (handler)=>wrapHandler(handler);
    const payloadPromptHandler = (handler)=>wrapHandler(handler);
    const payloadResourceHandler = (handler)=>wrapHandler(handler);
    // User
    const user = mcpAccessSettings.user;
    // MCP Server and Handler Options
    const MCPOptions = pluginOptions.mcp || {};
    const customMCPTools = MCPOptions.tools || [];
    const customMCPPrompts = MCPOptions.prompts || [];
    const customMCPResources = MCPOptions.resources || [];
    const MCPHandlerOptions = MCPOptions.handlerOptions || {};
    const serverOptions = MCPOptions.serverOptions || {};
    const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false;
    // Experimental MCP Tool Requirements
    const isDevelopment = process.env.NODE_ENV === 'development';
    const experimentalTools = pluginOptions?.experimental?.tools || {};
    const collectionsPluginConfig = pluginOptions.collections || {};
    const globalsPluginConfig = pluginOptions.globals || {};
    const collectionsDirPath = experimentalTools && experimentalTools.collections?.collectionsDirPath ? experimentalTools.collections.collectionsDirPath : join(process.cwd(), 'src/collections');
    const configFilePath = experimentalTools && experimentalTools.config?.configFilePath ? experimentalTools.config.configFilePath : join(process.cwd(), 'src/payload.config.ts');
    const jobsDirPath = experimentalTools && experimentalTools.jobs?.jobsDirPath ? experimentalTools.jobs.jobsDirPath : join(process.cwd(), 'src/jobs');
    try {
        return createMcpHandler((server)=>{
            // Get enabled collections
            const enabledCollectionSlugs = getEnabledSlugs(collectionsPluginConfig, 'collection');
            // Collection Operation Tools
            enabledCollectionSlugs.forEach((enabledCollectionSlug)=>{
                try {
                    const schema = configSchema.definitions?.[enabledCollectionSlug];
                    const toolCapabilities = mcpAccessSettings?.[`${toCamelCase(enabledCollectionSlug)}`];
                    const allowCreate = toolCapabilities?.create;
                    const allowUpdate = toolCapabilities?.update;
                    const allowFind = toolCapabilities?.find;
                    const allowDelete = toolCapabilities?.delete;
                    if (allowCreate) {
                        registerTool(allowCreate, `Create ${enabledCollectionSlug}`, ()=>createResourceTool(server, req, user, useVerboseLogs, enabledCollectionSlug, collectionsPluginConfig, schema), payload, useVerboseLogs);
                    }
                    if (allowUpdate) {
                        registerTool(allowUpdate, `Update ${enabledCollectionSlug}`, ()=>updateResourceTool(server, req, user, useVerboseLogs, enabledCollectionSlug, collectionsPluginConfig, schema), payload, useVerboseLogs);
                    }
                    if (allowFind) {
                        registerTool(allowFind, `Find ${enabledCollectionSlug}`, ()=>findResourceTool(server, req, user, useVerboseLogs, enabledCollectionSlug, collectionsPluginConfig), payload, useVerboseLogs);
                    }
                    if (allowDelete) {
                        registerTool(allowDelete, `Delete ${enabledCollectionSlug}`, ()=>deleteResourceTool(server, req, user, useVerboseLogs, enabledCollectionSlug, collectionsPluginConfig), payload, useVerboseLogs);
                    }
                } catch (error) {
                    throw new APIError(`Error registering tools for collection ${enabledCollectionSlug}: ${String(error)}`, 500);
                }
            });
            // Global Operation Tools
            const enabledGlobalSlugs = getEnabledSlugs(globalsPluginConfig, 'global');
            enabledGlobalSlugs.forEach((enabledGlobalSlug)=>{
                try {
                    const schema = configSchema.definitions?.[enabledGlobalSlug];
                    const toolCapabilities = mcpAccessSettings?.[`${toCamelCase(enabledGlobalSlug)}`];
                    const allowFind = toolCapabilities?.['find'];
                    const allowUpdate = toolCapabilities?.['update'];
                    if (allowFind) {
                        registerTool(allowFind, `Find ${enabledGlobalSlug}`, ()=>findGlobalTool(server, req, user, useVerboseLogs, enabledGlobalSlug, globalsPluginConfig), payload, useVerboseLogs);
                    }
                    if (allowUpdate) {
                        registerTool(allowUpdate, `Update ${enabledGlobalSlug}`, ()=>updateGlobalTool(server, req, user, useVerboseLogs, enabledGlobalSlug, globalsPluginConfig, schema), payload, useVerboseLogs);
                    }
                } catch (error) {
                    throw new APIError(`Error registering tools for global ${enabledGlobalSlug}: ${String(error)}`, 500);
                }
            });
            // Custom tools
            customMCPTools.forEach((tool)=>{
                const camelCasedToolName = toCamelCase(tool.name);
                const isToolEnabled = mcpAccessSettings['payload-mcp-tool']?.[camelCasedToolName] ?? false;
                registerTool(isToolEnabled, tool.name, ()=>server.tool(tool.name, tool.description, tool.parameters, payloadToolHandler(tool.handler)), payload, useVerboseLogs);
            });
            // Custom prompts
            customMCPPrompts.forEach((prompt)=>{
                const camelCasedPromptName = toCamelCase(prompt.name);
                const isPromptEnabled = mcpAccessSettings['payload-mcp-prompt']?.[camelCasedPromptName] ?? false;
                if (isPromptEnabled) {
                    server.registerPrompt(prompt.name, {
                        argsSchema: prompt.argsSchema,
                        description: prompt.description,
                        title: prompt.title
                    }, payloadPromptHandler(prompt.handler));
                    if (useVerboseLogs) {
                        payload.logger.info(`[payload-mcp] ✅ Prompt: ${prompt.title} Registered.`);
                    }
                } else if (useVerboseLogs) {
                    payload.logger.info(`[payload-mcp] ⏭️ Prompt: ${prompt.title} Skipped.`);
                }
            });
            // Custom resources
            customMCPResources.forEach((resource)=>{
                const camelCasedResourceName = toCamelCase(resource.name);
                const isResourceEnabled = mcpAccessSettings['payload-mcp-resource']?.[camelCasedResourceName] ?? false;
                if (isResourceEnabled) {
                    server.registerResource(resource.name, // @ts-expect-error - Overload type is not working however -- ResourceTemplate OR String is a valid type
                    resource.uri, {
                        description: resource.description,
                        mimeType: resource.mimeType,
                        title: resource.title
                    }, payloadResourceHandler(resource.handler));
                    if (useVerboseLogs) {
                        payload.logger.info(`[payload-mcp] ✅ Resource: ${resource.title} Registered.`);
                    }
                } else if (useVerboseLogs) {
                    payload.logger.info(`[payload-mcp] ⏭️ Resource: ${resource.title} Skipped.`);
                }
            });
            // Experimental - Collection Schema Modfication Tools
            if (mcpAccessSettings.collections?.create && experimentalTools.collections?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.collections.create, 'Create Collection', ()=>createCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.collections?.delete && experimentalTools.collections?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.collections.delete, 'Delete Collection', ()=>deleteCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.collections?.find && experimentalTools.collections?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.collections.find, 'Find Collection', ()=>findCollectionTool(server, req, useVerboseLogs, collectionsDirPath), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.collections?.update && experimentalTools.collections?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.collections.update, 'Update Collection', ()=>updateCollectionTool(server, req, useVerboseLogs, collectionsDirPath, configFilePath), payload, useVerboseLogs);
            }
            // Experimental - Payload Config Modification Tools
            if (mcpAccessSettings.config?.find && experimentalTools.config?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.config.find, 'Find Config', ()=>findConfigTool(server, req, useVerboseLogs, configFilePath), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.config?.update && experimentalTools.config?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.config.update, 'Update Config', ()=>updateConfigTool(server, req, useVerboseLogs, configFilePath), payload, useVerboseLogs);
            }
            // Experimental - Job Modification Tools
            if (mcpAccessSettings.jobs?.create && experimentalTools.jobs?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.jobs.create, 'Create Job', ()=>createJobTool(server, req, useVerboseLogs, jobsDirPath), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.jobs?.update && experimentalTools.jobs?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.jobs.update, 'Update Job', ()=>updateJobTool(server, req, useVerboseLogs, jobsDirPath), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.jobs?.run && experimentalTools.jobs?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.jobs.run, 'Run Job', ()=>runJobTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            // Experimental - Auth Modification Tools
            if (mcpAccessSettings.auth?.auth && experimentalTools.auth?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.auth.auth, 'Auth', ()=>authTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.auth?.login && experimentalTools.auth?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.auth.login, 'Login', ()=>loginTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.auth?.verify && experimentalTools.auth?.enabled && isDevelopment) {
                registerTool(mcpAccessSettings.auth.verify, 'Verify', ()=>verifyTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.auth?.resetPassword && experimentalTools.auth?.enabled) {
                registerTool(mcpAccessSettings.auth.resetPassword, 'Reset Password', ()=>resetPasswordTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.auth?.forgotPassword && experimentalTools.auth?.enabled) {
                registerTool(mcpAccessSettings.auth.forgotPassword, 'Forgot Password', ()=>forgotPasswordTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            if (mcpAccessSettings.auth?.unlock && experimentalTools.auth?.enabled) {
                registerTool(mcpAccessSettings.auth.unlock, 'Unlock', ()=>unlockTool(server, req, useVerboseLogs), payload, useVerboseLogs);
            }
            if (useVerboseLogs) {
                payload.logger.info('[payload-mcp] 🚀 MCP Server Ready.');
            }
        }, {
            serverInfo: serverOptions.serverInfo
        }, {
            basePath: MCPHandlerOptions.basePath || '/api',
            maxDuration: MCPHandlerOptions.maxDuration || 60,
            // INFO: Disabled until developer clarity is reached for server side streaming and we have an auth pattern for all SSE patterns
            // redisUrl: MCPHandlerOptions.redisUrl || process.env.REDIS_URL,
            verboseLogs: useVerboseLogs
        });
    } catch (error) {
        throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500);
    }
};

//# sourceMappingURL=getMcpHandler.js.map