const graphQLPlayground = require('graphql-playground-middleware-express').default;

function initPlayground() {
  if ((!this.config.graphQL.disablePlaygroundInProduction && process.env.NODE_ENV === 'production') || process.env.NODE_ENV !== 'production') {
    this.router.get(this.config.routes.graphQLPlayground, graphQLPlayground({
      endpoint: `${this.config.routes.api}${this.config.routes.graphQL}`,
      settings: {
        'request.credentials': 'include',
      },
    }));
  }
}

module.exports = initPlayground;
