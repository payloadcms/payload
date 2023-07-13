import { PayloadRequest } from '../express/types';

/**
 * Rollback the transaction from the req using the db adapter and removes it from the req
 */
export async function killTransaction(req: PayloadRequest): Promise<void> {
  const {
    transactionID,
    payload,
  } = req;
  if (transactionID) {
    await payload.db.rollbackTransaction(req.transactionID);
    delete req.transactionID;
  }
}
