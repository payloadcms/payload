import type { TransactionOptions } from 'mongodb';
import { BeginTransaction } from '../../database/types';
import { APIError } from '../../errors';


export const beginTransaction: BeginTransaction = async function beginTransaction(
  options: TransactionOptions = {},
) {
  if (!this.connection) {
    throw new APIError('beginTransaction called while no connection to the database exists');
  }
  if (!this.session) {
    this.session = await this.connection.getClient().startSession();
  }
  if (this.session.inTransaction()) {
    this.payload.logger.warn('beginTransaction called while transaction already exists');
  } else {
    this.session.startTransaction(options);
  }
};
