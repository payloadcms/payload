/* eslint-disable no-underscore-dangle */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
import { createAutopopulateOptions } from './createAutopopulateOptions';

/**
 * @param {Object}              [dbQuery={}]
 * @param {Object}              [options={}]
 * @param {Object|String}       [options.select]
 * @param {Object|String}       [options.sort]
 * @param {Object|String}       [options.customLabels]
 * @param {Object}              [options.collation]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean}             [options.lean=false]
 * @param {Boolean}             [options.leanWithId=true]
 * @param {Number}              [options.offset=0] - Use offset or page to set skip position
 * @param {Number}              [options.page=1]o
 * @param {Number}              [options.limit=10]
 * @param {Number}              [options.depth=10]
 * @param {Function}            [callback]
 *
 * @returns {Promise}
 */

function paginatePlugin(dbQuery, options, callback) {
  dbQuery = dbQuery || {};
  options = Object.assign({}, paginatePlugin.options, options);
  options.customLabels = options.customLabels ? options.customLabels : {};

  const defaultLimit = 10;

  const { select } = options;
  const { sort } = options;
  const collation = options.collation || {};
  const { populate } = options;
  const lean = options.lean || false;
  const leanWithId = options.hasOwnProperty('leanWithId') ? options.leanWithId : true;
  const limit = options.hasOwnProperty('limit') ? parseInt(options.limit, 0) : defaultLimit;
  let skip;
  let offset;
  let page;

  // Custom Labels
  const labelTotal = options.customLabels.totalDocs ? options.customLabels.totalDocs : 'totalDocs';
  const labelLimit = options.customLabels.limit ? options.customLabels.limit : 'limit';
  const labelPage = options.customLabels.page ? options.customLabels.page : 'page';
  const labelTotalPages = options.customLabels.totalPages ? options.customLabels.totalPages : 'totalPages';
  const labelDocs = options.customLabels.docs ? options.customLabels.docs : 'docs';
  const labelNextPage = options.customLabels.nextPage ? options.customLabels.nextPage : 'nextPage';
  const labelPrevPage = options.customLabels.prevPage ? options.customLabels.prevPage : 'prevPage';
  const labelPagingCounter = options.customLabels.pagingCounter ? options.customLabels.pagingCounter : 'pagingCounter';

  if (options.hasOwnProperty('offset')) {
    offset = parseInt(options.offset, 0);
    skip = offset;
  } else if (options.hasOwnProperty('page')) {
    page = parseInt(options.page, 0);
    skip = (page - 1) * limit;
  } else {
    offset = 0;
    page = 1;
    skip = offset;
  }

  const count = this.countDocuments(dbQuery).exec();
  const model = this.find(dbQuery, {}, { ...createAutopopulateOptions({ depth: options.depth, locale: options.locale }) });
  model.select(select);
  model.sort(sort);
  model.lean(lean);

  // Hack for mongo < v3.4
  if (Object.keys(collation).length > 0) {
    model.collation(collation);
  }

  if (limit) {
    model.skip(skip);
    model.limit(limit);
  }

  if (populate) {
    model.populate(populate);
  }

  let docs = model.exec();

  if (lean && leanWithId) {
    docs = docs.then((docs) => {
      docs.forEach((doc) => {
        doc.id = String(doc._id);
      });
      return docs;
    });
  }

  return Promise.all([count, docs])
    .then((values) => {
      const result = {
        [labelDocs]: values[1],
        [labelTotal]: values[0],
        [labelLimit]: limit,
      };

      if (offset !== undefined) {
        result.offset = offset;
      }

      if (page !== undefined) {
        const pages = Math.ceil(values[0] / limit) || 1;

        result.hasPrevPage = false;
        result.hasNextPage = false;

        result[labelPage] = page;
        result[labelTotalPages] = pages;
        result[labelPagingCounter] = ((page - 1) * limit) + 1;

        // Set prev page
        if (page > 1) {
          result.hasPrevPage = true;
          result[labelPrevPage] = (page - 1);
        } else {
          result[labelPrevPage] = null;
        }

        // Set next page
        if (page < pages) {
          result.hasNextPage = true;
          result[labelNextPage] = (page + 1);
        } else {
          result[labelNextPage] = null;
        }
      }

      // Adding support for callbacks if specified.
      if (typeof callback === 'function') {
        return callback(null, result);
      }
      return Promise.resolve(result);
    }).catch((reject) => {
      if (typeof callback === 'function') {
        return callback(reject);
      }
      return Promise.reject(reject);
    });
}

function bindPaginate(schema) {
  schema.statics.paginate = paginatePlugin;
}

/**
 * @param {Schema} schema
 */
module.exports = bindPaginate;

module.exports.paginate = paginatePlugin;
