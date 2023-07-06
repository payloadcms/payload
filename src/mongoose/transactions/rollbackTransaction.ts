import { RollbackTransaction } from '../../database/types';


export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction() {
  if (!this.session?.inTransaction()) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists');
    return;
  }
  await this.session.abortTransaction();
  this.session = await this.session.endSession();
};
