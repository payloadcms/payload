const executeAccess = require('../../auth/executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const find = async (args) => {
  const {
    where,
    page,
    limit,
    depth,
    config,
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      locale,
      fallbackLocale,
      payloadAPI,
    },
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = await executeAccess({ req }, collectionConfig.access.read);
  const hasWhereAccess = typeof accessResults === 'object';

  const queryToBuild = {};

  if (where) {
    queryToBuild.where = {
      and: [where],
    };
  }

  if (hasWhereAccess) {
    if (!where) {
      queryToBuild.where = {
        and: [
          accessResults,
        ],
      };
    } else {
      queryToBuild.where.and.push(accessResults);
    }
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  collectionConfig.hooks.beforeRead.forEach((hook) => hook({ req, query }));

  // /////////////////////////////////////
  // 3. Perform database operation
  // /////////////////////////////////////

  let { sort } = args;

  if (!sort) {
    if (collectionConfig.timestamps) {
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

      return performFieldOperations(config, collectionConfig, {
        data,
        req,
        hook: 'afterRead',
        operationName: 'read',
      });
    })),
  };

  // /////////////////////////////////////
  // 6. Execute afterRead collection hook
  // /////////////////////////////////////

  let afterReadResult = result;

  if (typeof afterRead === 'function') {
    afterReadResult = {
      ...result,
      docs: await Promise.all(result.docs.map(async (doc) => {
        let docRef = doc;

        collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
          await priorHook;

          docRef = await hook({ req, query, doc }) || doc;
        }, Promise.resolve());

        return docRef;
      })),
    };
  }

  // /////////////////////////////////////
  // 7. Return results
  // /////////////////////////////////////

  return afterReadResult;
};

module.exports = find;
