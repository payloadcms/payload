export function combineWhereConstraints(constraints, as = 'and') {
    if (constraints.length === 0) {
        return {};
    }
    const reducedConstraints = constraints.reduce((acc, constraint)=>{
        if (constraint && typeof constraint === 'object' && Object.keys(constraint).length > 0) {
            if (as in constraint) {
                // merge the objects under the shared key
                acc[as] = [
                    ...acc[as],
                    ...constraint[as]
                ];
            } else {
                // the constraint does not share the key
                acc[as]?.push(constraint);
            }
        }
        return acc;
    }, {
        [as]: []
    });
    if (reducedConstraints[as]?.length === 0) {
        // If there are no constraints, return an empty object
        return {};
    }
    return reducedConstraints;
}

//# sourceMappingURL=combineWhereConstraints.js.map