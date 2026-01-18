/**
 * Combines a base filter with a tenant list filter
 *
 * Combines where constraints inside of an AND operator
 */ export const combineFilters = ({ baseFilter, customFilter })=>async (args)=>{
        const filterConstraints = [];
        if (typeof baseFilter === 'function') {
            const baseFilterResult = await baseFilter(args);
            if (baseFilterResult) {
                filterConstraints.push(baseFilterResult);
            }
        }
        const customFilterResult = await customFilter(args);
        if (customFilterResult) {
            filterConstraints.push(customFilterResult);
        }
        if (filterConstraints.length) {
            const combinedWhere = {
                and: []
            };
            filterConstraints.forEach((constraint)=>{
                if (combinedWhere.and && constraint && typeof constraint === 'object') {
                    combinedWhere.and.push(constraint);
                }
            });
            return combinedWhere;
        }
        // Access control will take it from here
        return null;
    };

//# sourceMappingURL=combineFilters.js.map