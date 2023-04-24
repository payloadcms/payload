import graphQLPlayground from 'graphql-playground-middleware-express';
import { Payload } from '../payload';

function initPlayground(ctx: Payload): void {
  if ((!ctx.config.graphQL.disable && !ctx.config.graphQL.disablePlaygroundInProduction && process.env.NODE_ENV === 'production') || process.env.NODE_ENV !== 'production') {
    ctx.router.get(ctx.config.routes.graphQLPlayground, graphQLPlayground({
      endpoint: `${ctx.config.routes.api}${ctx.config.routes.graphQL}`,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore ISettings interface has all properties required for some reason
      settings: {
        'request.credentials': 'include',
      },
    }));
  }
}

export default initPlayground;
