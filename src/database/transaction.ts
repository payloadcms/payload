import { Transaction } from './types';

export const transaction: Transaction = async function transaction(
  callback: () => Promise<unknown>,
  options,
) {
  const id = await this.beginTransaction(options);
  try {
    await callback();
    await this.commitTransaction(id);
  } catch (err: unknown) {
    await this.rollbackTransaction(id);
  }
};
