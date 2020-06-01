const defaultUser = require('../auth/default');

const sanitizeConfig = (config) => {
  const sanitizedConfig = { ...config };

  sanitizedConfig.admin = config.admin || {};

  if (!sanitizedConfig.cookiePrefix) sanitizedConfig.cookiePrefix = 'payload';

  if (!sanitizedConfig.globals) sanitizedConfig.globals = [];

  if (!sanitizedConfig.admin.user) {
    sanitizedConfig.admin.user = config.admin.user || 'users';

    sanitizedConfig.collections.push(defaultUser);
  }

  if (!sanitizedConfig.graphQL) {
    sanitizedConfig.graphQL = {};
  }

  if (sanitizedConfig.graphQL.mutations) sanitizedConfig.graphQL.mutations = {};
  if (sanitizedConfig.graphQL.queries) sanitizedConfig.graphQL.queries = {};

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
    api: (config.routes && config.routes.api) ? config.routes.api : '/api',
    graphQL: (config.routes && config.routes.graphQL) ? config.routes.graphQL : '/graphql',
    graphQLPlayground: (config.routes && config.routes.graphQLPlayground) ? config.routes.graphQLPlayground : '/graphql-playground',
  };

  sanitizedConfig.components = { ...(config.components || {}) };
  sanitizedConfig.hooks = { ...(config.hooks || {}) };

  return sanitizedConfig;
};

module.exports = sanitizeConfig;
