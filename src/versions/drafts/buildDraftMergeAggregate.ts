import { PipelineStage } from 'mongoose';
import { SanitizedCollectionConfig } from '../../collections/config/types';

type Args = {
  config: SanitizedCollectionConfig
  query: Record<string, unknown>
}

export const buildDraftMergeAggregate = ({ config, query }: Args): PipelineStage[] => [
  // Merge in versions by parent ID
  {
    $lookup: {
      from: `_${config.slug}_versions`,
      as: '_versions',
      localField: '_id',
      foreignField: 'parent',
    },
  },

  // Add a new field
  // with the last (newest) version returned
  {
    $addFields: {
      _version: {
        $arrayElemAt: ['$_versions', -1],
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
            $and: [
              {
                $ne: ['$_version', undefined],
              },
              {
                $gt: ['$_version.updatedAt', '$updatedAt'],
              },
            ],
          },
          then: {
            $mergeObjects: [
              '$$ROOT',
              {
                $mergeObjects: [
                  '$_version.version',
                  {
                    updatedAt: '$_version.updatedAt',
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

  // Clear out the temporarily added `versions`
  {
    $project: {
      _version: 0,
      _versions: 0,
    },
  },

  // Run the original query on the results
  {
    $match: query,
  },
];
