import { handleEndpoints } from 'payload';
import { formatAdminURL } from 'payload/shared';
import { generateOGImage } from './og/index.js';
let initedOGEndpoint = false;
const handlerBuilder = config => async (request, args) => {
  const awaitedConfig = await config;
  // Add this endpoint only when using Next.js, still can be overridden.
  if (initedOGEndpoint === false && !awaitedConfig.endpoints.some(endpoint => endpoint.path === '/og' && endpoint.method === 'get')) {
    awaitedConfig.endpoints.push({
      handler: generateOGImage,
      method: 'get',
      path: '/og'
    });
  }
  initedOGEndpoint = true;
  const awaitedParams = await args.params;
  const response = await handleEndpoints({
    config,
    path: formatAdminURL({
      apiRoute: awaitedConfig.routes.api,
      path: awaitedParams ? `/${awaitedParams.slug.join('/')}` : undefined
    }),
    request
  });
  return response;
};
export const OPTIONS = handlerBuilder;
export const GET = handlerBuilder;
export const POST = handlerBuilder;
export const DELETE = handlerBuilder;
export const PATCH = handlerBuilder;
export const PUT = handlerBuilder;
//# sourceMappingURL=index.js.map