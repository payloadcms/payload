export const setsAreEqual = (xs, ys)=>xs.size === ys.size && [
        ...xs
    ].every((x)=>ys.has(x));

//# sourceMappingURL=setsAreEqual.js.map