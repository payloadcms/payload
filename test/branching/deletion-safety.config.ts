import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { deletionSafetySpy } from './deletionSafetySpy.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const deletionSafetyMediaDirectory = path.resolve(dirname, 'deletion-safety-media')
export const deletionSafetyBranchGlobalSlug = 'deletion-safety-branch-settings'
export const deletionSafetyGlobalSlug = 'deletion-safety-settings'
export const deletionSafetyVersionedGlobalSlug = 'deletion-safety-versioned-settings'
export const deletionSafetyMediaSlug = 'deletion-safety-media'
export const deletionSafetyOwnersSlug = 'deletion-safety-owners'
export const deletionSafetyTargetsSlug = 'deletion-safety-targets'
export const deletionSafetyVersionedTargetsSlug = 'deletion-safety-versioned-targets'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [
      {
        slug: deletionSafetyTargetsSlug,
        fields: [
          { name: 'title', type: 'text' },
          {
            name: 'relatedTarget',
            type: 'relationship',
            relationTo: deletionSafetyTargetsSlug,
          },
        ],
        hooks: {
          afterChange: [
            ({ doc, operation }) => {
              if (
                operation === 'update' &&
                deletionSafetySpy.rejectTargetAfterChangeID !== undefined &&
                String(doc.id) === String(deletionSafetySpy.rejectTargetAfterChangeID)
              ) {
                throw new Error('Rejected target after change')
              }

              return doc
            },
          ],
          afterDelete: [
            async ({ doc }) => {
              if (
                deletionSafetySpy.rejectTargetAfterDeleteID !== undefined &&
                String(doc.id) === String(deletionSafetySpy.rejectTargetAfterDeleteID)
              ) {
                throw new Error('Rejected target after delete')
              }

              await deletionSafetySpy.afterTargetDelete?.({ doc })

              return doc
            },
          ],
          beforeDelete: [
            async ({ id, req }) => {
              await deletionSafetySpy.beforeTargetDelete?.({ id, req })
            },
          ],
          beforeValidate: [
            async ({ data, operation, originalDoc, req }) => {
              if (
                operation === 'update' &&
                deletionSafetySpy.queueJobBeforeTargetValidationFailureID !== undefined &&
                String(originalDoc?.id) ===
                  String(deletionSafetySpy.queueJobBeforeTargetValidationFailureID)
              ) {
                await req.payload.jobs.queue({
                  input: {
                    doc: {
                      relationTo: deletionSafetyTargetsSlug,
                      value: originalDoc.id,
                    },
                  },
                  overrideAccess: true,
                  req,
                  task: 'schedulePublish',
                  waitUntil: new Date(Date.now() + 60_000),
                })

                throw new Error('Rejected target after queueing a job')
              }

              if (
                operation === 'update' &&
                deletionSafetySpy.directDatabaseWriteFailureID !== undefined &&
                deletionSafetySpy.directDatabaseWriteTargetID !== undefined &&
                String(originalDoc?.id) === String(deletionSafetySpy.directDatabaseWriteFailureID)
              ) {
                await req.payload.db.updateOne({
                  id: deletionSafetySpy.directDatabaseWriteTargetID,
                  collection: deletionSafetyTargetsSlug,
                  data: { title: 'written directly by rejected target hook' },
                  req,
                })

                throw new Error('Rejected target after direct database write')
              }

              return data
            },
          ],
        },
        lockDocuments: false,
        versions: false,
      },
      {
        slug: deletionSafetyOwnersSlug,
        fields: [
          { name: 'title', type: 'text' },
          {
            name: 'target',
            type: 'relationship',
            relationTo: deletionSafetyTargetsSlug,
          },
          {
            name: 'media',
            type: 'relationship',
            relationTo: deletionSafetyMediaSlug,
          },
        ],
        hooks: {
          beforeChange: [
            ({ data }) =>
              deletionSafetySpy.mainMergeCollectionDependencyTargetID === undefined
                ? data
                : {
                    ...data,
                    target: deletionSafetySpy.mainMergeCollectionDependencyTargetID,
                  },
          ],
          beforeRead: [
            ({ doc }) => {
              deletionSafetySpy.ownerBeforeReadCount += 1

              return doc
            },
          ],
        },
        select: () => ({ title: true }),
        trash: true,
        versions: { drafts: true },
      },
      {
        slug: deletionSafetyVersionedTargetsSlug,
        fields: [{ name: 'title', type: 'text' }],
        hooks: {
          afterChange: [
            async ({ doc, operation, req }) => {
              if (deletionSafetySpy.rejectVersionedTargetCreate && operation === 'create') {
                const mainDraft = await req.payload.findByID({
                  id: doc.id,
                  collection: deletionSafetyVersionedTargetsSlug,
                  disableErrors: true,
                  draft: true,
                  overrideAccess: true,
                })
                const mainVersions = await req.payload.findVersions({
                  collection: deletionSafetyVersionedTargetsSlug,
                  limit: 0,
                  overrideAccess: true,
                })

                deletionSafetySpy.mainContentVisibleDuringRejectedCreate =
                  mainDraft !== null ||
                  mainVersions.docs.some(({ version }) => version.title === doc.title)

                throw new Error('Rejected after saving the merge version')
              }
            },
          ],
          afterDelete: [
            ({ doc }) => {
              if (
                deletionSafetySpy.rejectVersionedTargetAfterDeleteID !== undefined &&
                String(doc.id) === String(deletionSafetySpy.rejectVersionedTargetAfterDeleteID)
              ) {
                throw new Error('Rejected versioned target after delete')
              }

              return doc
            },
          ],
        },
        versions: { drafts: true, maxPerDoc: 2 },
      },
      {
        slug: deletionSafetyMediaSlug,
        fields: [{ name: 'alt', type: 'text' }],
        hooks: {
          afterChange: [
            async ({ doc, operation }) => {
              if (
                operation === 'update' &&
                (deletionSafetySpy.rejectUploadAfterChange ||
                  (deletionSafetySpy.rejectUploadAfterChangeID !== undefined &&
                    String(doc.id) === String(deletionSafetySpy.rejectUploadAfterChangeID)))
              ) {
                await deletionSafetySpy.beforeRejectedUploadAfterChange?.()
                throw new Error('Rejected upload after change')
              }

              return doc
            },
          ],
          afterDelete: [
            ({ doc }) => {
              deletionSafetySpy.uploadAfterDeleteCount += 1

              return doc
            },
          ],
          beforeDelete: [
            async ({ id, req }) => {
              deletionSafetySpy.uploadBeforeDeleteCount += 1

              if (deletionSafetySpy.rejectUploadBeforeDelete) {
                throw new Error('Rejected upload deletion')
              }

              let ownerTargetID: number | string | undefined

              if (deletionSafetySpy.createUploadOwnerOnSecondBeforeDelete) {
                deletionSafetySpy.bulkDeleteHookIDs.push(id)

                if (deletionSafetySpy.bulkDeleteHookIDs.length === 2) {
                  ownerTargetID = deletionSafetySpy.bulkDeleteHookIDs[0]
                }
              } else if (deletionSafetySpy.createUploadOwnerOnBeforeDelete) {
                ownerTargetID = id
              }

              if (ownerTargetID !== undefined && !deletionSafetySpy.hasCreatedUploadOwner) {
                deletionSafetySpy.hasCreatedUploadOwner = true

                await req.payload.create({
                  collection: deletionSafetyOwnersSlug,
                  data: {
                    media: ownerTargetID,
                    title: 'owner created during beforeDelete',
                  },
                  overrideAccess: true,
                  req,
                })
              }

              await deletionSafetySpy.beforeUploadDelete?.({ id, req })
            },
          ],
          beforeValidate: [
            async ({ data, operation, originalDoc, req }) => {
              if (operation === 'update' && originalDoc?.id !== undefined) {
                deletionSafetySpy.uploadUpdateRequestFiles.push({
                  id: originalDoc.id,
                  name: req.file?.name,
                })

                if (deletionSafetySpy.reassignUploadLockDuringValidation) {
                  const reassignLock = deletionSafetySpy.reassignUploadLockDuringValidation

                  await req.payload.update({
                    id: reassignLock.lockID,
                    collection: 'payload-locked-documents',
                    data: {
                      user: {
                        relationTo: 'users',
                        value: reassignLock.userID,
                      },
                    },
                    overrideAccess: true,
                    req: reassignLock.useCurrentRequest ? req : undefined,
                  })
                }
              }

              const shouldWriteFromHook =
                operation === 'update' &&
                deletionSafetySpy.uploadHookWriteTargetID !== undefined &&
                ((deletionSafetySpy.uploadHookWriteID !== undefined &&
                  String(originalDoc?.id) === String(deletionSafetySpy.uploadHookWriteID)) ||
                  (deletionSafetySpy.uploadHookWriteID === undefined &&
                    deletionSafetySpy.rejectUploadAfterHookWriteID !== undefined &&
                    String(originalDoc?.id) ===
                      String(deletionSafetySpy.rejectUploadAfterHookWriteID)))

              if (shouldWriteFromHook) {
                if (deletionSafetySpy.directDatabaseUploadHookWrite) {
                  await req.payload.db.updateOne({
                    id: deletionSafetySpy.uploadHookWriteTargetID,
                    collection: deletionSafetyTargetsSlug,
                    data: { title: 'written by rejected upload hook' },
                    req,
                  })
                } else {
                  await req.payload.update({
                    id: deletionSafetySpy.uploadHookWriteTargetID,
                    collection: deletionSafetyTargetsSlug,
                    data: { title: 'written by rejected upload hook' },
                    disableTransaction: deletionSafetySpy.disableUploadHookWriteTransaction,
                    overrideAccess: true,
                    req,
                  })
                }
              }

              if (
                operation === 'update' &&
                deletionSafetySpy.rejectUploadAfterHookWriteID !== undefined &&
                String(originalDoc?.id) === String(deletionSafetySpy.rejectUploadAfterHookWriteID)
              ) {
                throw new Error('Rejected upload after hook write')
              }

              const shouldRejectSelectedUpload =
                deletionSafetySpy.rejectUploadBeforeValidateID !== undefined &&
                String(originalDoc?.id) === String(deletionSafetySpy.rejectUploadBeforeValidateID)

              if (
                operation === 'update' &&
                (deletionSafetySpy.rejectUploadBeforeValidate || shouldRejectSelectedUpload)
              ) {
                throw new Error('Rejected upload validation')
              }

              return data
            },
          ],
        },
        upload: { staticDir: deletionSafetyMediaDirectory },
        versions: { drafts: { schedulePublish: true } },
      },
    ],
    globals: [
      {
        slug: deletionSafetyBranchGlobalSlug,
        fields: [
          { name: 'title', type: 'text' },
          {
            name: 'target',
            type: 'relationship',
            relationTo: deletionSafetyTargetsSlug,
          },
        ],
        hooks: {
          beforeChange: [
            ({ data }) =>
              deletionSafetySpy.mainMergeGlobalDependencyTargetID === undefined
                ? data
                : {
                    ...data,
                    target: deletionSafetySpy.mainMergeGlobalDependencyTargetID,
                  },
          ],
        },
        versions: false,
      },
      {
        slug: deletionSafetyGlobalSlug,
        fields: [
          {
            name: 'target',
            type: 'relationship',
            relationTo: deletionSafetyTargetsSlug,
          },
        ],
        hooks: {
          beforeRead: [
            ({ doc }) => {
              deletionSafetySpy.globalBeforeReadCount += 1

              return doc
            },
          ],
          beforeValidate: [
            async ({ data, req }) => {
              if (deletionSafetySpy.reassignGlobalLockDuringValidation) {
                const reassignLock = deletionSafetySpy.reassignGlobalLockDuringValidation

                await req.payload.update({
                  id: reassignLock.lockID,
                  collection: 'payload-locked-documents',
                  data: {
                    user: {
                      relationTo: 'users',
                      value: reassignLock.userID,
                    },
                  },
                  overrideAccess: true,
                  req: reassignLock.useCurrentRequest ? req : undefined,
                })
              }

              return data
            },
          ],
        },
        select: () => ({}),
        versions: false,
      },
      {
        slug: deletionSafetyVersionedGlobalSlug,
        fields: [
          {
            name: 'target',
            type: 'relationship',
            relationTo: deletionSafetyTargetsSlug,
          },
        ],
        versions: { drafts: true },
      },
    ],
    jobs: {
      jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
        ...defaultJobsCollection,
        hooks: {
          ...defaultJobsCollection.hooks,
          beforeDelete: [
            ...(defaultJobsCollection.hooks?.beforeDelete ?? []),
            async ({ req }) => {
              const branch = deletionSafetySpy.activeLeaseBranchOnCompletedJobDelete

              if (!branch || deletionSafetySpy.hasCreatedRaceJob) {
                return
              }

              deletionSafetySpy.hasCreatedRaceJob = true

              await req.payload.create({
                collection: 'payload-jobs',
                data: {
                  input: { branch },
                  processingUntil: new Date(Date.now() + 60_000).toISOString(),
                  taskSlug: 'scheduleMerge',
                  waitUntil: new Date(Date.now() - 60_000).toISOString(),
                },
                overrideAccess: true,
                req,
              })
            },
          ],
        },
      }),
    },
  },
  suite: 'branching-deletion-safety',
})
