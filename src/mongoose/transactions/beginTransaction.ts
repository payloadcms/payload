import type { TransactionOptions } from 'mongodb';
import { BeginTransaction } from '../../database/types';
import { APIError } from '../../errors';

let transactionsNotAvailable;
export const beginTransaction: BeginTransaction = async function beginTransaction(
  options: TransactionOptions = {},
) {
  if (!this.connection) {
    throw new APIError('beginTransaction called while no connection to the database exists');
  }
  if (transactionsNotAvailable) {
    return;
  }
  if (!this.connection.get('replicaSet')) {
    transactionsNotAvailable = true;
    this.payload.logger.warn('Database transactions for MongoDB are only available when connecting to a replica set. Operations will continue without using transactions.');
  } else {
    if (!this.session) {
      this.session = await this.connection.getClient().startSession();
    }
    if (this.session.inTransaction()) {
      this.payload.logger.warn('beginTransaction called while transaction already exists');
    } else {
      this.session.startTransaction(options);
    }
  }
};
