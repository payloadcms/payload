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

  let defaultLimit = 10;

  let select = options.select;
  let sort = options.sort;
  let collation = options.collation || {};
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.hasOwnProperty('leanWithId') ? options.leanWithId : true;
  let limit = options.hasOwnProperty('limit') ? parseInt(options.limit) : defaultLimit;
  let skip;
  let offset;
  let page;

  // Custom Labels
  let labelTotal = options.customLabels.totalDocs ? options.customLabels.totalDocs : 'totalDocs';
  let labelLimit = options.customLabels.limit ? options.customLabels.limit : 'limit';
  let labelPage = options.customLabels.page ? options.customLabels.page : 'page';
  let labelTotalPages = options.customLabels.totalPages ? options.customLabels.totalPages : 'totalPages';
  let labelDocs = options.customLabels.docs ? options.customLabels.docs : 'docs';
  let labelNextPage = options.customLabels.nextPage ? options.customLabels.nextPage : 'nextPage';
  let labelPrevPage = options.customLabels.prevPage ? options.customLabels.prevPage : 'prevPage';
  let labelPagingCounter = options.customLabels.pagingCounter ? options.customLabels.pagingCounter : 'pagingCounter';

  if (options.hasOwnProperty('offset')) {
    offset = parseInt(options.offset);
    skip = offset;
  } else if (options.hasOwnProperty('page')) {
    page = parseInt(options.page);
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

      let result = {
        [labelDocs]: values[1],
        [labelTotal]: values[0],
        [labelLimit]: limit
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
      } else {
        return Promise.resolve(result);
      }
    }).catch((reject) => {
      if (typeof callback === 'function') {
        return callback(reject);
      } else {
        return Promise.reject(reject);
      }
    });
}

/**
 * @param {Schema} schema
 */
module.exports = function (schema) {
  schema.statics.paginate = paginatePlugin;
};

module.exports.paginate = paginatePlugin;
