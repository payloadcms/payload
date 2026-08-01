import type { LocalAPIFromDefinitions } from './localAPI.js'

import { access } from '../auth/operations/access.js'
import { auth, type authLocalAPI } from '../auth/operations/auth.js'
import { type forgotPasswordLocalAPI, forgotPassword } from '../auth/operations/forgotPassword.js'
import { init } from '../auth/operations/init.js'
import { login, type loginLocalAPI } from '../auth/operations/login.js'
import { logout } from '../auth/operations/logout.js'
import { me } from '../auth/operations/me.js'
import { refresh } from '../auth/operations/refresh.js'
import { registerFirstUser } from '../auth/operations/registerFirstUser.js'
import { type resetPasswordLocalAPI, resetPassword } from '../auth/operations/resetPassword.js'
import { unlock, type unlockLocalAPI } from '../auth/operations/unlock.js'
import { type verifyEmailLocalAPI, verifyEmail } from '../auth/operations/verifyEmail.js'
import { count, type countLocalAPI } from '../collections/operations/count.js'
import {
  type countVersionsLocalAPI,
  countVersions,
} from '../collections/operations/countVersions.js'
import { create, type createLocalAPI } from '../collections/operations/create.js'
import { type deleteLocalAPI, remove } from '../collections/operations/delete.js'
import { docAccess as collectionDocAccess } from '../collections/operations/docAccess.js'
import { type duplicateLocalAPI, duplicate } from '../collections/operations/duplicate.js'
import { find as findCollection, type findLocalAPI } from '../collections/operations/find.js'
import { type findByIDLocalAPI, findByID } from '../collections/operations/findByID.js'
import { type findDistinctLocalAPI, findDistinct } from '../collections/operations/findDistinct.js'
import {
  type findVersionByIDLocalAPI,
  findVersionByID,
} from '../collections/operations/findVersionByID.js'
import { type findVersionsLocalAPI, findVersions } from '../collections/operations/findVersions.js'
import {
  type restoreVersionLocalAPI,
  restoreVersion,
} from '../collections/operations/restoreVersion.js'
import { update, type updateLocalAPI } from '../collections/operations/update.js'
import {
  type countGlobalVersionsLocalAPI,
  countVersions as countGlobalVersions,
} from '../globals/operations/countGlobalVersions.js'
import { docAccess as globalDocAccess } from '../globals/operations/docAccess.js'
import { type findGlobalLocalAPI, find as findGlobal } from '../globals/operations/findOne.js'
import {
  type findGlobalVersionByIDLocalAPI,
  findVersionByID as findGlobalVersionByID,
} from '../globals/operations/findVersionByID.js'
import {
  type findGlobalVersionsLocalAPI,
  findVersions as findGlobalVersions,
} from '../globals/operations/findVersions.js'
import {
  type restoreGlobalVersionLocalAPI,
  restoreVersion as restoreGlobalVersion,
} from '../globals/operations/restoreVersion.js'
import { type updateGlobalLocalAPI, update as updateGlobal } from '../globals/operations/update.js'
import { handleSchedules } from '../queues/operations/handleSchedules/index.js'
import { run } from '../queues/operations/runJobs/index.js'
import { deleteStagedFile } from '../uploads/operations/deleteStagedFile.js'
import { getFile } from '../uploads/operations/getFile.js'
import { getFileFromURL } from '../uploads/operations/getFileFromURL.js'
import { getInstructions } from '../uploads/operations/getInstructions.js'
import { uploadStagedFile } from '../uploads/operations/uploadStagedFile.js'

export { defineLocalAPI, defineOperation, invokeOperation } from './defineOperation.js'
export type {
  OperationExposures,
  OperationHandler,
  OperationInvocationOptions,
  OperationLocalAfterHandlerArgs,
  OperationLocalDefinition,
  OperationRESTExposure,
  OperationTarget,
  PayloadOperation,
} from './defineOperation.js'
export {
  getCollectionOperationInputSchema,
  getGlobalOperationInputSchema,
  OperationValidationError,
  validateCollectionOperationData,
  validateGlobalOperationData,
} from './entitySchema.js'
export type { OperationEntityInputSchema } from './entitySchema.js'
export { operationsToLocalAPI } from './localAPI.js'
export type {
  LocalAPIFromDefinitions,
  LocalAPIFromOperations,
  LocalAPIOptions,
} from './localAPI.js'
export { operationsToRESTEndpoints } from './rest.js'
export { operationWhereSchema } from './schemaFields.js'

/**
 * Type-only projection of explicit Local API signatures. Referencing the full operation tuple
 * here would create a recursive `Payload -> operations -> Payload` declaration type. Runtime
 * Local API methods are still generated exclusively from `payloadOperations` below.
 */
type PayloadLocalAPIDefinition =
  | typeof authLocalAPI
  | typeof countGlobalVersionsLocalAPI
  | typeof countLocalAPI
  | typeof countVersionsLocalAPI
  | typeof createLocalAPI
  | typeof deleteLocalAPI
  | typeof duplicateLocalAPI
  | typeof findByIDLocalAPI
  | typeof findDistinctLocalAPI
  | typeof findGlobalLocalAPI
  | typeof findGlobalVersionByIDLocalAPI
  | typeof findGlobalVersionsLocalAPI
  | typeof findLocalAPI
  | typeof findVersionByIDLocalAPI
  | typeof findVersionsLocalAPI
  | typeof forgotPasswordLocalAPI
  | typeof loginLocalAPI
  | typeof resetPasswordLocalAPI
  | typeof restoreGlobalVersionLocalAPI
  | typeof restoreVersionLocalAPI
  | typeof unlockLocalAPI
  | typeof updateGlobalLocalAPI
  | typeof updateLocalAPI
  | typeof verifyEmailLocalAPI

export type PayloadLocalAPI = LocalAPIFromDefinitions<PayloadLocalAPIDefinition>

/**
 * The single registry of server-side Payload operations.
 *
 * Array order also defines REST route precedence within each operation target.
 * Every adapter derives its schema, validation, and execution from these entries.
 */
export const payloadOperations = Object.freeze([
  access,
  getInstructions,
  uploadStagedFile,
  deleteStagedFile,
  forgotPassword,
  init,
  login,
  logout,
  me,
  refresh,
  registerFirstUser,
  resetPassword,
  unlock,
  verifyEmail,
  count,
  countVersions,
  create,
  remove,
  collectionDocAccess,
  findVersions,
  duplicate,
  findCollection,
  findDistinct,
  findByID,
  findVersionByID,
  restoreVersion,
  update,
  countGlobalVersions,
  globalDocAccess,
  findGlobal,
  findGlobalVersionByID,
  findGlobalVersions,
  restoreGlobalVersion,
  updateGlobal,
  run,
  handleSchedules,
  getFileFromURL,
  getFile,
  auth,
] as const)

export type PayloadOperationTarget = (typeof payloadOperations)[number]['target']

type RegisteredPayloadOperation = (typeof payloadOperations)[number]

type ActionForTarget<TOperation, TTarget> = TOperation extends {
  readonly action: infer TAction extends string
  readonly target: TTarget
}
  ? TAction
  : never

export type PayloadOperationAction<TTarget extends PayloadOperationTarget> = ActionForTarget<
  RegisteredPayloadOperation,
  TTarget
>

type OperationForTargetAndAction<TOperation, TTarget, TAction> = TOperation extends {
  readonly action: TAction
  readonly target: TTarget
}
  ? TOperation
  : never

export type PayloadOperationByTargetAndAction<
  TTarget extends PayloadOperationTarget,
  TAction extends PayloadOperationAction<TTarget>,
> = OperationForTargetAndAction<RegisteredPayloadOperation, TTarget, TAction>

export const getPayloadOperation = <
  TTarget extends PayloadOperationTarget,
  TAction extends PayloadOperationAction<TTarget>,
>(
  target: TTarget,
  action: TAction,
): PayloadOperationByTargetAndAction<TTarget, TAction> => {
  const operation = payloadOperations.find(
    (candidate) => candidate.target === target && candidate.action === action,
  )

  if (!operation) {
    throw new Error(`Payload operation "${target}:${action}" is not registered`)
  }

  return operation as unknown as PayloadOperationByTargetAndAction<TTarget, TAction>
}
