import type { TransactionOptions } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { BeginTransaction } from '../../../../types';
import { APIError } from '../../../../../errors';

let transactionsNotAvailable;
export const beginTransaction: BeginTransaction = async function beginTransaction(
  options: TransactionOptions = {},
) {
  let id = null;
  if (!this.connection) {
    throw new APIError('beginTransaction called while no connection to the database exists');
  }

  if (transactionsNotAvailable) return id;

  if (!this.connection.get('replicaSet')) {
    transactionsNotAvailable = true;
    this.payload.logger.warn('Database transactions for MongoDB are only available when connecting to a replica set. Operations will continue without using transactions.');
  } else {
    id = uuid();
    if (!this.sessions[id]) {
      this.sessions[id] = await this.connection.getClient().startSession();
    }
    if (this.sessions[id].inTransaction()) {
      this.payload.logger.warn('beginTransaction called while transaction already exists');
    } else {
      await this.sessions[id].startTransaction(options);
    }
  }
  return id;
};
