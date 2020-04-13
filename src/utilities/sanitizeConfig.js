const sanitizeConfig = (config) => {
  const sanitizedConfig = { ...config };

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
    api: (config.routes && config.routes.api) ? config.routes.api : '/api',
    graphQL: (config.routes && config.routes.graphQL) ? config.routes.graphQL : '/graphql',
    graphQLPlayground: (config.routes && config.routes.graphQLPlayground) ? config.routes.graphQLPlayground : '/graphql-playground',
  };
  sanitizedConfig.components = { ...(config.components || {}) };

  return sanitizedConfig;
};

module.exports = sanitizeConfig;
