export const parentFilterOptions = (breadcrumbsFieldSlug = 'breadcrumbs')=>({ id })=>{
        if (id) {
            return {
                id: {
                    not_equals: id
                },
                [`${breadcrumbsFieldSlug}.doc`]: {
                    not_in: [
                        id
                    ]
                }
            };
        }
        return true;
    };

//# sourceMappingURL=parentFilterOptions.js.map