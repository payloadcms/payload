import { RollbackTransaction } from 'payload/dist/database/types';
import { sql } from 'drizzle-orm';


export const rollbackTransaction: RollbackTransaction = async function rollbackTransaction(id = '') {
  if (!this.sessions[id]) {
    this.payload.logger.warn('rollbackTransaction called when no transaction exists');
    return;
  }
  await this.sessions[id].execute(sql`ROLLBACK;`);
  delete this.sessions[id];
};
