import graphQLPlayground from 'graphql-playground-middleware-express';
import { Payload } from '../index';

function initPlayground(ctx: Payload): void {
  if ((!ctx.config.graphQL.disablePlaygroundInProduction && process.env.NODE_ENV === 'production') || process.env.NODE_ENV !== 'production') {
    ctx.router.get(ctx.config.routes.graphQLPlayground, graphQLPlayground({
      endpoint: `${ctx.config.routes.api}${ctx.config.routes.graphQL}`,
      settings: {
        'request.credentials': 'include',
      },
    }));
  }
}

export default initPlayground;
