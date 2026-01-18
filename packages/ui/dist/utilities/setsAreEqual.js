/**
 * Function to determine whether two sets are equal or not.
 */export const setsAreEqual = (lhs, rhs) => {
  return lhs.size === rhs.size && Array.from(lhs).every(value => rhs.has(value));
};
//# sourceMappingURL=setsAreEqual.js.map