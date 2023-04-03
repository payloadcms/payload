export const cloneDataFromOriginalDoc = (originalDocData: unknown): unknown => {
  if (Array.isArray(originalDocData)) {
    return originalDocData.map((row) => ({
      ...row,
    }));
  }

  if (typeof originalDocData === 'object' && originalDocData !== null) {
    return { ...originalDocData };
  }

  return originalDocData;
};
