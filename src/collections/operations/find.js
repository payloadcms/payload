const executeStatic = require('../../auth/executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const find = async (args) => {
  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const policyResults = await executeStatic(args, args.config.access.read);
  const hasWherePolicy = typeof policyResults === 'object';

  const queryToBuild = {};

  if (args.where) {
    queryToBuild.where = {
      and: [args.where],
    };
  }

  if (hasWherePolicy) {
    if (!args.where) {
      queryToBuild.where = {
        and: [
          policyResults,
        ],
      };
    } else {
      queryToBuild.where.and.push(policyResults);
    }
  }

  let options = {
    ...args,
    query: await args.Model.buildQuery(queryToBuild, args.req.locale),
  };

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  const { beforeRead } = args.config.hooks;

  if (typeof beforeRead === 'function') {
    options = await beforeRead(options);
  }

  // /////////////////////////////////////
  // 3. Perform database operation
  // /////////////////////////////////////

  const {
    query,
    page,
    limit,
    depth,
    Model,
    req: {
      locale,
      fallbackLocale,
      payloadAPI,
    },
    config,
  } = options;

  let { sort } = options;

  if (!sort) {
    if (config.timestamps) {
      sort = '-createdAt';
    } else {
      sort = '-_id';
    }
  }

  const optionsToExecute = {
    page: page || 1,
    limit: limit || 10,
    sort,
    collation: sort ? { locale: 'en' } : {}, // case-insensitive sort in MongoDB
    options: {
      autopopulate: false,
    },
  };

  // Only allow depth override within REST.
  // If allowed in GraphQL, it would break resolvers
  // as a full object will be returned instead of an ID string
  if (payloadAPI === 'REST') {
    if (depth && depth !== '0') {
      optionsToExecute.options.autopopulate = {
        maxDepth: parseInt(depth, 10),
      };
    }
  }

  let result = await Model.paginate(query, optionsToExecute);

  // /////////////////////////////////////
  // 4. Execute field-level access
  // /////////////////////////////////////

  result = {
    ...result,
    docs: await Promise.all(result.docs.map(async (doc) => {
      if (locale && doc.setLocale) {
        doc.setLocale(locale, fallbackLocale);
      }

      const data = doc.toJSON({ virtuals: true });

      return performFieldOperations(args.config, {
        ...options, data, hook: 'afterRead', operationName: 'read',
      });
    })),
  };

  // /////////////////////////////////////
  // 6. Execute afterRead collection hook
  // /////////////////////////////////////

  const { afterRead } = args.config.hooks;
  let afterReadResult = null;

  if (typeof afterRead === 'function') {
    afterReadResult = {
      ...result,
      docs: await Promise.all(result.docs.map(async (doc) => afterRead({
        options,
        doc,
      }) || doc)),
    };
  }

  // /////////////////////////////////////
  // 7. Return results
  // /////////////////////////////////////

  return afterReadResult || result;
};

module.exports = find;
