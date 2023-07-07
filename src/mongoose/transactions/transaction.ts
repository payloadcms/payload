import { Transaction } from '../../database/types';


export const transaction: Transaction = async function transaction(
  callback: () => Promise<unknown>,
  options,
) {
  await this.beginTransaction(options);
  try {
    const result = await callback();
    await this.commitTransaction();
    return result;
  } catch (err: unknown) {
    await this.rollbackTransaction();
  }
  return null;
};
