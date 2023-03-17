import { Config as GeneratedTypes } from 'payload/generated-types';
import find from './find';
import findByID from './findByID';
import create from './create';
import update, { ByIDOptions as UpdateByIDOptions, ManyOptions as UpdateManyOptions, Options as UpdateOptions } from './update';
import deleteLocal, { ByIDOptions as DeleteByIDOptions, ManyOptions as DeleteManyOptions, Options as DeleteOptions } from './delete';
import auth from '../../../auth/operations/local';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';
import { BulkOperationResult } from '../../config/types';

async function localUpdate <T extends keyof GeneratedTypes['collections']>(options: UpdateByIDOptions<T>): Promise<GeneratedTypes['collections'][T]>
async function localUpdate <T extends keyof GeneratedTypes['collections']>(options: UpdateManyOptions<T>): Promise<BulkOperationResult<T>>
async function localUpdate <T extends keyof GeneratedTypes['collections']>(options: UpdateOptions<T>): Promise<GeneratedTypes['collections'][T] | BulkOperationResult<T>> {
  return update<T>(this, options);
}

async function localDelete <T extends keyof GeneratedTypes['collections']>(options: DeleteByIDOptions<T>): Promise<GeneratedTypes['collections'][T]>
async function localDelete <T extends keyof GeneratedTypes['collections']>(options: DeleteManyOptions<T>): Promise<BulkOperationResult<T>>
async function localDelete <T extends keyof GeneratedTypes['collections']>(options: DeleteOptions<T>): Promise<GeneratedTypes['collections'][T] | BulkOperationResult<T>> {
  return deleteLocal<T>(this, options);
}

export default {
  find,
  findByID,
  create,
  update: localUpdate,
  localDelete,
  auth,
  findVersionByID,
  findVersions,
  restoreVersion,
};
