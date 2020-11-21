import { Config } from './types';
import defaultUser from '../auth/default';
import sanitizeCollection from '../collections/config/sanitize';
import { InvalidConfiguration } from '../errors';
import sanitizeGlobals from '../globals/config/sanitize';
import checkDuplicateCollections from '../utilities/checkDuplicateCollections';

const sanitizeConfig = (config: Config): Config => {
  const sanitizedConfig = { ...config };

  // TODO: remove default values from sanitize in favor of assigning in the schema within validateSchema and use https://www.npmjs.com/package/ajv#coercing-data-types where needed
  if (sanitizedConfig.publicENV === undefined) sanitizedConfig.publicENV = {};

  if (sanitizedConfig.defaultDepth === undefined) sanitizedConfig.defaultDepth = 2;
  if (sanitizedConfig.maxDepth === undefined) sanitizedConfig.maxDepth = 10;

  sanitizedConfig.collections = sanitizedConfig.collections.map((collection) => sanitizeCollection(sanitizedConfig.collections, collection));
  checkDuplicateCollections(sanitizedConfig.collections);

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
    sanitizedConfig.collections.push(sanitizeCollection(sanitizedConfig.collections, defaultUser));
  } else if (!sanitizedConfig.collections.find((c) => c.slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(`${sanitizedConfig.admin.user} is not a valid admin user collection`);
  }

  sanitizedConfig.email = config.email || {};
  // if (!sanitizedConfig.email.transport) sanitizedConfig.email.transport = 'mock';

  sanitizedConfig.graphQL = config.graphQL || {};
  sanitizedConfig.graphQL.maxComplexity = (sanitizedConfig.graphQL && sanitizedConfig.graphQL.maxComplexity) ? sanitizedConfig.graphQL.maxComplexity : 1000;
  sanitizedConfig.graphQL.disablePlaygroundInProduction = (sanitizedConfig.graphQL && sanitizedConfig.graphQL.disablePlaygroundInProduction !== undefined) ? sanitizedConfig.graphQL.disablePlaygroundInProduction : true;

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
    api: (config.routes && config.routes.api) ? config.routes.api : '/api',
    graphQL: (config.routes && config.routes.graphQL) ? config.routes.graphQL : '/graphql',
    graphQLPlayground: (config.routes && config.routes.graphQLPlayground) ? config.routes.graphQLPlayground : '/graphql-playground',
  };

  sanitizedConfig.rateLimit = config.rateLimit || {};
  sanitizedConfig.rateLimit.window = sanitizedConfig.rateLimit.window || 15 * 60 * 100; // 15min default
  sanitizedConfig.rateLimit.max = sanitizedConfig.rateLimit.max || 500;

  if (!sanitizedConfig.express) {
    sanitizedConfig.express = {
      json: {},
    };
  }

  sanitizedConfig.components = { ...(config.components || {}) };
  sanitizedConfig.hooks = { ...(config.hooks || {}) };
  sanitizedConfig.admin = { ...(config.admin || {}) };

  return sanitizedConfig;
};

export default sanitizeConfig;
