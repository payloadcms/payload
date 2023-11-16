export const setsAreEqual = (xs: Set<unknown>, ys: Set<unknown>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x))
