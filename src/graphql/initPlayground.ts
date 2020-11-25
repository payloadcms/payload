import graphQLPlayground from 'graphql-playground-middleware-express';

function initPlayground(): void {
  if ((!this.config.graphQL.disablePlaygroundInProduction && process.env.NODE_ENV === 'production') || process.env.NODE_ENV !== 'production') {
    this.router.get(this.config.routes.graphQLPlayground, graphQLPlayground({
      endpoint: `${this.config.routes.api}${this.config.routes.graphQL}`,
      settings: {
        'request.credentials': 'include',
      },
    }));
  }
}

export default initPlayground;
