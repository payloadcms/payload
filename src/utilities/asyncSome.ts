const asyncSome = async (arr: unknown[], predicate: (event: unknown) => Promise<unknown>): Promise<boolean> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const e of arr) {
    // eslint-disable-next-line no-await-in-loop
    if (await predicate(e)) return true;
  }
  return false;
};

export default asyncSome;
