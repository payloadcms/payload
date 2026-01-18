import { hasWhereAccessResult } from '../auth/index.js';
/**
 * Combines two queries into a single query, using an AND operator
 */ export const combineQueries = (where, access)=>{
    if (!where && !access) {
        return {};
    }
    const and = where ? [
        where
    ] : [];
    if (hasWhereAccessResult(access)) {
        and.push(access);
    }
    return {
        and
    };
};

//# sourceMappingURL=combineQueries.js.map