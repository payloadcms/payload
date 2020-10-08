const defaultUser = require('../auth/default');
const sanitizeCollection = require('../collections/sanitize');
const sanitizeGlobals = require('../globals/sanitize');

const sanitizeConfig = (config) => {
  const sanitizedConfig = { ...config };

  if (sanitizedConfig.publicENV === undefined) sanitizedConfig.publicENV = {};

  if (sanitizedConfig.defaultDepth === undefined) sanitizedConfig.defaultDepth = 2;
  if (sanitizedConfig.maxDepth === undefined) sanitizedConfig.maxDepth = 10;

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig.collections, collection));

  if (sanitizedConfig.globals) {
    sanitizedConfig.globals = sanitizeGlobals(sanitizedConfig.collections, sanitizedConfig.globals);
  } else {
    sanitizedConfig.globals = [];
  }

  if (!sanitizedConfig.cookiePrefix) sanitizedConfig.cookiePrefix = 'payload';

  sanitizedConfig.csrf = [
    ...(Array.isArray(config.csrf) ? config.csrf : []),
    config.serverURL,
  ];

  sanitizedConfig.admin = config.admin || {};

  sanitizedConfig.upload = config.upload || {};

  if (!sanitizedConfig.admin.user) {
    sanitizedConfig.admin.user = 'users';
    sanitizedConfig.collections.push(defaultUser);
  }

  sanitizedConfig.email = config.email || {};
  sanitizedConfig.email.fromName = sanitizedConfig.email.fromName || 'Payload';
  sanitizedConfig.email.fromAddress = sanitizedConfig.email.fromAddress || 'hello@payloadcms.com';

  sanitizedConfig.graphQL = config.graphQL || {};
  sanitizedConfig.graphQL.maxComplexity = (sanitizedConfig.graphQL && sanitizedConfig.graphQL.maxComplexity) ? sanitizedConfig.graphQL.maxComplexity : 1000;

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
    api: (config.routes && config.routes.api) ? config.routes.api : '/api',
    graphQL: (config.routes && config.routes.graphQL) ? config.routes.graphQL : '/graphql',
    graphQLPlayground: (config.routes && config.routes.graphQLPlayground) ? config.routes.graphQLPlayground : '/graphql-playground',
  };

  sanitizedConfig.rateLimit = config.rateLimit || {};
  sanitizedConfig.rateLimit.window = sanitizedConfig.rateLimit.window || 15 * 60 * 100; // 15min default
  sanitizedConfig.rateLimit.max = sanitizedConfig.rateLimit.max || 500;

  sanitizedConfig.components = { ...(config.components || {}) };
  sanitizedConfig.hooks = { ...(config.hooks || {}) };
  sanitizedConfig.admin = { ...(config.admin || {}) };

  return sanitizedConfig;
};

module.exports = sanitizeConfig;
