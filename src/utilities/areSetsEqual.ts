export const areSetsEqual = (set1, set2) => set1?.size === set2?.size
  && [...set1].every((x) => set2.has(x));
