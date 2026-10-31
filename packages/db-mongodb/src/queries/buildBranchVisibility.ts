import type { PipelineStage } from 'mongoose'

import { branchChangesCollectionSlug, MAIN_BRANCH } from 'payload'

import type { MongooseAdapter } from '../index.js'

const lookupField = '__payloadBranchChange'

type BranchVisibilityStage = Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>

export const buildBranchVisibilityStages = ({
  adapter,
  branch,
  collectionSlug,
  mode = 'documents',
}: {
  adapter: MongooseAdapter
  branch: string
  collectionSlug: string
  mode?: 'documents' | 'drafts' | 'history'
}): BranchVisibilityStage[] => {
  const branchChangesModel = adapter.collections[branchChangesCollectionSlug]

  if (!branchChangesModel) {
    throw new Error(`Collection model "${branchChangesCollectionSlug}" is not initialized.`)
  }

  const canonicalIDExpression =
    mode === 'documents'
      ? { $ifNull: ['$_branchDocID', '$_id'] }
      : { $ifNull: ['$_branchParent', '$parent'] }
  const hasNoMatchingChange = { $eq: [{ $size: `$${lookupField}` }, 0] }
  const operation = { $arrayElemAt: [`$${lookupField}.operation`, 0] }
  const mainVisibility =
    mode === 'history'
      ? {
          $or: [
            hasNoMatchingChange,
            {
              $and: [
                { $ne: [operation, 'create'] },
                {
                  $or: [
                    {
                      $and: [
                        {
                          $eq: [{ $arrayElemAt: [`$${lookupField}.baseVersionID`, 0] }, null],
                        },
                        {
                          $eq: [
                            { $arrayElemAt: [`$${lookupField}.baseVersionUpdatedAt`, 0] },
                            null,
                          ],
                        },
                      ],
                    },
                    {
                      $eq: [
                        { $toString: '$_id' },
                        { $arrayElemAt: [`$${lookupField}.baseVersionID`, 0] },
                      ],
                    },
                    {
                      $lte: [
                        '$updatedAt',
                        { $arrayElemAt: [`$${lookupField}.baseVersionUpdatedAt`, 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }
      : hasNoMatchingChange
  const branchVisibility = mode === 'history' ? true : { $ne: [operation, 'delete'] }

  return [
    { $match: { _branch: { $in: [MAIN_BRANCH, branch] } } },
    {
      $lookup: {
        as: lookupField,
        from: branchChangesModel.collection.name,
        let: { canonicalDocumentID: { $toString: canonicalIDExpression } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$branch', branch] },
                  { $eq: ['$collectionSlug', collectionSlug] },
                  { $eq: ['$documentID', '$$canonicalDocumentID'] },
                ],
              },
            },
          },
          {
            $project: {
              baseVersionID: 1,
              baseVersionUpdatedAt: 1,
              operation: 1,
            },
          },
          { $limit: 1 },
        ],
      },
    },
    {
      $match: {
        $expr: {
          $or: [
            { $and: [{ $eq: ['$_branch', MAIN_BRANCH] }, mainVisibility] },
            { $and: [{ $eq: ['$_branch', branch] }, branchVisibility] },
          ],
        },
      },
    },
    { $unset: lookupField },
  ]
}
