import find from './find';
import findByID from './findByID';
import create from './create';
import update, { ByIDOptions, ManyOptions, Options as UpdateOptions } from './update';
import localDelete from './delete';
import auth from '../../../auth/operations/local';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';

async function localUpdate <T = any>(options: ByIDOptions<T>): Promise<T>
async function localUpdate <T = any>(options: ManyOptions<T>): Promise<T[]>
async function localUpdate <T = any>(options: UpdateOptions<T>): Promise<T | T[]> {
  return update<T>(this, options);
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
