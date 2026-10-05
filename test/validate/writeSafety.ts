import type { CollectionBeforeChangeHook } from 'payload'

import path from 'path'
import { logoutOperation, refreshOperation, saveVersion } from 'payload'

// Direct internal import intentionally exercises the upload write guard.
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { uploadFiles } from '../../packages/payload/src/uploads/uploadFiles.js'
import { devUser } from '../credentials.js'
import {
  validationUploadsDir,
  validationWriteTargetGlobalSlug,
  writeTargetsSlug,
} from './shared.js'

export const runWriteAttempt: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'validate') {
    return data
  }

  const targetID = data.targetID as string | undefined

  switch (data.writeAttempt) {
    case 'create':
      await req.payload.create({
        collection: writeTargetsSlug,
        data: { title: 'must not be created' },
        disableTransaction: true,
        req,
      })
      break

    case 'delete':
      await req.payload.delete({
        id: targetID!,
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
      })
      break

    case 'deleteMany':
      await req.payload.delete({
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
        where: {
          id: {
            equals: targetID!,
          },
        },
      })
      break

    case 'forgotPassword':
      await req.payload.forgotPassword({
        collection: 'users',
        data: { email: 'validation-write-guard-forgot-password@example.com' },
        req,
      })
      break

    case 'jobsHandleSchedules':
      await req.payload.jobs.handleSchedules({
        allQueues: true,
        req,
      })
      break

    case 'jobsQueue':
      await req.payload.jobs.queue({
        input: {},
        req,
        task: 'validationWriteGuardProbe',
      })
      break

    case 'login':
      await req.payload.login({
        collection: 'users',
        data: { email: devUser.email, password: 'not-the-real-password' },
        req,
      })
      break

    case 'logout':
      await logoutOperation({
        collection: req.payload.collections['users']!,
        req,
      })
      break

    case 'refresh':
      await refreshOperation({
        collection: req.payload.collections['users']!,
        req,
      })
      break

    case 'resetPassword':
      await req.payload.resetPassword({
        collection: 'users',
        data: { password: 'must-not-be-set', token: 'any-token' },
        overrideAccess: true,
        req,
      })
      break

    case 'restoreGlobalVersion':
      await req.payload.restoreGlobalVersion({
        id: targetID!,
        slug: validationWriteTargetGlobalSlug,
        req,
      })
      break

    case 'restoreVersion':
      await req.payload.restoreVersion({
        id: targetID!,
        collection: writeTargetsSlug,
        disableTransaction: true,
        req,
      })
      break

    case 'update':
      await req.payload.update({
        id: targetID!,
        collection: writeTargetsSlug,
        data: { title: 'must not be updated' },
        disableTransaction: true,
        req,
      })
      break

    case 'updateGlobal':
      await req.payload.updateGlobal({
        slug: validationWriteTargetGlobalSlug,
        data: {
          title: 'must not be updated',
        },
        req,
      })
      break

    case 'updateMany':
      await req.payload.update({
        collection: writeTargetsSlug,
        data: {
          title: 'must not be updated',
        },
        disableTransaction: true,
        req,
        where: {
          id: {
            equals: targetID!,
          },
        },
      })
      break

    case 'upload': {
      const fileData = Buffer.from('must not be uploaded')

      await uploadFiles(
        req.payload,
        [
          {
            buffer: fileData,
            path: path.join(validationUploadsDir, 'blocked.txt'),
          },
        ],
        req,
      )
      break
    }

    case 'verifyEmail':
      await req.payload.verifyEmail({
        collection: 'users',
        req,
        token: 'any-token',
      })
      break

    case 'version':
      await saveVersion({
        id: targetID,
        collection: req.payload.collections[writeTargetsSlug]!.config,
        docWithLocales: {
          id: targetID,
          title: 'must not create a version',
        },
        operation: 'update',
        payload: req.payload,
        req,
      })
      break
  }

  return data
}
