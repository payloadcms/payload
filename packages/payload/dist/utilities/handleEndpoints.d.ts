import type { SanitizedConfig } from '../config/types.js';
/**
 * Attaches the Payload REST API to any backend framework that uses Fetch Request/Response
 * like Next.js (app router), Remix, Bun, Hono.
 *
 * ### Example: Using Hono
 * ```ts
 * import { handleEndpoints } from 'payload';
 * import { serve } from '@hono/node-server';
 * import { loadEnv } from 'payload/node';
 *
 * const port = 3001;
 * loadEnv();
 *
 * const { default: config } = await import('@payload-config');
 *
 * const server = serve({
 *   fetch: async (request) => {
 *     const response = await handleEndpoints({
 *       config,
 *       request: request.clone(),
 *     });
 *
 *     return response;
 *   },
 *   port,
 * });
 *
 * server.on('listening', () => {
 *   console.log(`API server is listening on http://localhost:${port}/api`);
 * });
 * ```
 */
export declare const handleEndpoints: ({ basePath, config: incomingConfig, path, payloadInstanceCacheKey, request, }: {
    basePath?: string;
    config: Promise<SanitizedConfig> | SanitizedConfig;
    /** Override path from the request */
    path?: string;
    payloadInstanceCacheKey?: string;
    request: Request;
}) => Promise<Response>;
//# sourceMappingURL=handleEndpoints.d.ts.map