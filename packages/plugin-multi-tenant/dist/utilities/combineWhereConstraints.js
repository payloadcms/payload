export function combineWhereConstraints(constraints) {
    if (constraints.length === 0) {
        return {};
    }
    if (constraints.length === 1 && constraints[0]) {
        return constraints[0];
    }
    const andConstraint = {
        and: []
    };
    constraints.forEach((constraint)=>{
        if (andConstraint.and && constraint && typeof constraint === 'object') {
            andConstraint.and.push(constraint);
        }
    });
    return andConstraint;
}

//# sourceMappingURL=combineWhereConstraints.js.map