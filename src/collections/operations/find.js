const deepmerge = require('deepmerge');
const combineMerge = require('../../utilities/combineMerge');
const executePolicy = require('../../auth/executePolicy');
const performFieldOperations = require('../../fields/performFieldOperations');

const find = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policyResults = await executePolicy(args, args.config.policies.read);
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
      sort,
      depth,
      Model,
      req: {
        locale,
        fallbackLocale,
        payloadAPI,
      },
    } = options;

    const optionsToExecute = {
      page: page || 1,
      limit: limit || 10,
      sort,
      collation: sort ? { locale: 'en' } : {}, // case-insensitive sort in MongoDB
      options: {},
    };

    // Only allow depth override within REST.
    // If allowed in GraphQL, it would break resolvers
    // as a full object will be returned instead of an ID string
    if (payloadAPI === 'REST') {
      if (depth && depth !== '0') {
        optionsToExecute.options.autopopulate = {
          maxDepth: parseInt(depth, 10),
        };
      } else {
        optionsToExecute.options.autopopulate = false;
      }
    }

    let result = await Model.paginate(query, optionsToExecute);

    // /////////////////////////////////////
    // 4. Execute field-level policies
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
        docs: await Promise.all(result.docs.map(async (doc) => {
          return afterRead({
            options,
            doc,
          }) || doc;
        })),
      };
    }

    // /////////////////////////////////////
    // 7. Return results
    // /////////////////////////////////////

    return afterReadResult || result;
  } catch (err) {
    throw err;
  }
};

module.exports = find;
