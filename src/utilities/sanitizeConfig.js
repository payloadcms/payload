const defaultUser = require('../auth/default');
const sanitizeCollection = require('../collections/sanitize');
const sanitizeGlobals = require('../globals/sanitize');

const sanitizeConfig = (config) => {
  const sanitizedConfig = { ...config };

  if (sanitizedConfig.defaultDepth === undefined) sanitizedConfig.defaultDepth = 2;

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig.collections, collection));

  if (sanitizedConfig.globals) {
    sanitizedConfig.globals = sanitizeGlobals(sanitizedConfig.globals);
  } else {
    sanitizedConfig.globals = [];
  }

  if (!sanitizedConfig.cookiePrefix) sanitizedConfig.cookiePrefix = 'payload';

  sanitizedConfig.csrf = [
    ...(Array.isArray(config.csrf) ? config.csrf : []),
    config.serverURL,
  ];

  sanitizedConfig.admin = config.admin || {};

  if (!sanitizedConfig.admin.user) {
    sanitizedConfig.admin.user = 'users';
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
  sanitizedConfig.admin = { ...(config.admin || {}) };

  return sanitizedConfig;
};

module.exports = sanitizeConfig;
