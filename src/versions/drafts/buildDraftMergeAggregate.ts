import { PipelineStage } from 'mongoose';
import { SanitizedCollectionConfig } from '../../collections/config/types';

type Args = {
  config: SanitizedCollectionConfig
  query: Record<string, unknown>
}

export const buildDraftMergeAggregate = ({ config, query }: Args): PipelineStage[] => [
  // Add string-based ID to query with
  {
    $addFields: { id: { $toString: '$_id' } },
  },

  // Merge in one version
  // that has the same parent ID
  // and is newer, sorting by updatedAt
  {
    $lookup: {
      from: `_${config.slug}_versions`,
      as: 'docs',
      let: {
        id: { $toString: '$_id' },
        updatedAt: '$updatedAt',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$parent', '$$id'] },
                { $gt: ['$updatedAt', '$$updatedAt'] },
              ],
            },
          },
        },
        { $sort: { updatedAt: -1 } },
        { $limit: 1 },
      ],
    },
  },

  // Add a new field
  // with the first doc returned
  {
    $addFields: {
      doc: {
        $arrayElemAt: ['$docs', 0],
      },
    },
  },

  // If newer version exists,
  // merge the version into the root and
  // replace the updatedAt
  // Otherwise, do nothing to the root
  {
    $replaceRoot: {
      newRoot: {
        $cond: {
          if: {
            $ne: ['$doc', undefined],
          },
          then: {
            $mergeObjects: [
              '$$ROOT',
              {
                $mergeObjects: [
                  '$doc.version',
                  {
                    updatedAt: '$doc.updatedAt',
                  },
                ],
              },
            ],
          },
          else: '$$ROOT',
        },
      },
    },
  },

  // Clear out the temporarily added `docs`
  {
    $project: {
      doc: 0,
      docs: 0,
    },
  },

  // Run the original query on the results
  {
    $match: query,
  },
];
