import { PaginatedDocs } from '../../mongoose/types';
import { Collection } from '../../collections/config/types';

type Args = {
  collection: Collection;
  paginationOptions: any;
  query: Record<string, unknown>;
};

// This function makes it possible to filter documents by their newest
// version. Regardless if it is in the versions collection or not.
// This is done by first joining the versions collection on the parent
// and then replacing the document with the newest version if there is a
// newer version.
// This version also handles pagination for all documents, including
// versions. This means that the pagination is done on the newest version
// of each document.
async function findNewest({
  collection,
  paginationOptions,
  query,
}: Args): Promise<PaginatedDocs> {
  const page = paginationOptions.page ?? 1;
  const limit = paginationOptions.limit ?? 10;
  const skip = (page - 1) * limit;

  const results = await collection.Model.aggregate([
    // transform _id to string, so it can be used in the $lookup
    {
      $addFields: { _id: { $toString: '$_id' } },
    },
    // check if there is a newer version
    {
      $lookup: {
        // TODO: query from somewhere
        from: `_${collection.config.slug}_versions`,
        as: '_versions',
        // with mongo > 5.0 this can be shortened to
        // localField: '_id',
        // foreignField: 'parent',
        let: {
          // define id and updatedAt to be used in the pipeline
          id: '$_id',
          updatedAt: '$updatedAt',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    // only match versions that are newer than the document
                    $gt: ['$updatedAt', '$$updatedAt'],
                  },
                  {
                    //  join _id on parent
                    $eq: ['$parent', '$$id'],
                  },
                ],
              },
            },
          },
          // sort by updatedAt descending
          { $sort: { updatedAt: -1 } },
          // take the first (newest) version
          { $limit: 1 },
        ],
      },
    },
    // write the newest version to _version
    // and the size of _versions to _versionsSize
    {
      $addFields: {
        _version: {
          $arrayElemAt: ['$_versions', 0],
        },
        _versionsSize: {
          $size: '$_versions',
        },
      },
    },
    // replace the document with the newest version if there is one
    {
      $replaceRoot: {
        newRoot: {
          $cond: {
            // if there is no newer version
            if: {
              $eq: ['$_versionsSize', 0],
            },
            // then keep the document
            then: '$$ROOT',
            // otherwise replace the document with the newest version
            else: {
              $mergeObjects: [
                // take the newest _version.version,
                '$_version.version',
                // but keep the createdAt, and _id of the document
                // and use the updatedAt of the version
                {
                  _id: '$_id',
                  createdAt: '$createdAt',
                  updatedAt: '$_version.updatedAt',
                },
              ],
            },
          },
        },
      },
    },
    // remove the _version, _versionsSize and _versions fields
    {
      $project: {
        _versionsSize: 0,
        _version: 0,
        _versions: 0,
      },
    },
    // filter before counting the total number of documents
    {
      $match: query,
    },
    // sort before counting the total number of documents
    {
      $sort: Object.entries(paginationOptions.sort).reduce(
        (sort, [key, order]) => {
          return {
            ...sort,
            [key]: order === 'asc' ? 1 : -1,
          };
        },
        {},
      ),
    },
    // we need to simulate the pagination in this query
    // so we need to know the total number of documents
    // and the documents for the current page
    // we do this with a $facet to split the pipeline
    // in a lookup and a count
    {
      $facet: {
        docs: [
          // skip and limit
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
        count: [
          {
            // counts all filtered documents, but only the newest version
            // as we already replaced the document with the newest version
            // in the previous step
            $count: 'totalDocs',
          },
        ],
      },
    },
  ]);

  const [
    {
      count,
      docs,
    },
  ] = results;
  const totalDocs = count?.totalDocs ?? 0;
  // create the other pagination fields from totalDocs, limit and page
  const pagingCounter = Math.ceil(totalDocs / limit);
  const totalPages = pagingCounter;
  const hasPrevPage = page > 1;
  const prevPage = hasPrevPage ? page - 1 : null;
  const hasNextPage = page < totalPages;
  const nextPage = hasNextPage ? page + 1 : null;

  return {
    docs,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
  };
}

export const mergeDrafts = findNewest;
