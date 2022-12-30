import find from './find';
import findByID from './findByID';
import create from './create';
import update, { ByIDOptions as UpdateByIDOptions, ManyOptions as UpdateManyOptions, Options as UpdateOptions } from './update';
import deleteLocal, { ByIDOptions as DeleteByIDOptions, ManyOptions as DeleteManyOptions, Options as DeleteOptions } from './delete';
import auth from '../../../auth/operations/local';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';
import { TypeWithID } from '../../config/types';

async function localUpdate <T = any>(options: UpdateByIDOptions<T>): Promise<T>
async function localUpdate <T = any>(options: UpdateManyOptions<T>): Promise<T[]>
async function localUpdate <T = any>(options: UpdateOptions<T>): Promise<T | T[]> {
  return update<T>(this, options);
}

async function localDelete <T extends TypeWithID = any>(options: DeleteByIDOptions): Promise<T>
async function localDelete <T extends TypeWithID = any>(options: DeleteManyOptions): Promise<T[]>
async function localDelete <T extends TypeWithID = any>(options: DeleteOptions): Promise<T | T[]> {
  return deleteLocal<T>(this, options);
}

export default {
  find,
  findByID,
  create,
  update: localUpdate,
  delete: localDelete,
  auth,
  findVersionByID,
  findVersions,
  restoreVersion,
};
